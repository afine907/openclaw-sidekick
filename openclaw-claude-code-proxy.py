#!/usr/bin/env python3
"""
OpenClaw Claude Code Proxy
将 Anthropic API 格式转换为 OpenAI 格式，支持百度千帆等兼容 OpenAI 的后端
"""

import json
import httpx
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn

app = FastAPI()

# 配置
BACKEND_URL = "https://qianfan.baidubce.com/v2/coding"
BACKEND_API_KEY = "bce-v3/ALTAKSP-iI7GFAOT47EwOSJKDlz3a/301ccff7d9eb9c21832e4e679c3af1b9896c2ba1"
PROXY_KEY = "sk-openclaw-proxy"

def convert_anthropic_to_openai(anthropic_request: dict) -> dict:
    """将 Anthropic 格式请求转换为 OpenAI 格式"""
    # 所有模型都映射到 qianfan-code-latest
    openai_request = {
        "model": "qianfan-code-latest",
        "messages": anthropic_request.get("messages", []),
        "max_tokens": anthropic_request.get("max_tokens", 4096),
        "stream": anthropic_request.get("stream", False),
    }
    
    # 处理 system 消息
    if "system" in anthropic_request:
        system_content = anthropic_request["system"]
        if isinstance(system_content, str):
            openai_request["messages"].insert(0, {"role": "system", "content": system_content})
        elif isinstance(system_content, list):
            # 处理多段 system 消息
            system_text = ""
            for block in system_content:
                if block.get("type") == "text":
                    system_text += block.get("text", "")
            if system_text:
                openai_request["messages"].insert(0, {"role": "system", "content": system_text})
    
    # 处理工具定义
    if "tools" in anthropic_request:
        openai_tools = []
        for tool in anthropic_request["tools"]:
            if tool.get("type") == "function":
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": tool.get("name", ""),
                        "description": tool.get("description", ""),
                        "parameters": tool.get("input_schema", {})
                    }
                })
        if openai_tools:
            openai_request["tools"] = openai_tools
    
    # 处理 temperature 等参数
    for param in ["temperature", "top_p", "stop", "presence_penalty", "frequency_penalty"]:
        if param in anthropic_request:
            openai_request[param] = anthropic_request[param]
    
    return openai_request

def convert_openai_to_anthropic(openai_response: dict, model: str) -> dict:
    """将 OpenAI 格式响应转换为 Anthropic 格式"""
    choices = openai_response.get("choices", [])
    if not choices:
        return {"error": "No choices in response"}
    
    choice = choices[0]
    message = choice.get("message", {})
    content = message.get("content", "")
    
    # 处理工具调用
    tool_calls = message.get("tool_calls", [])
    content_blocks = []
    
    if content:
        content_blocks.append({"type": "text", "text": content})
    
    for tool_call in tool_calls:
        function = tool_call.get("function", {})
        content_blocks.append({
            "type": "tool_use",
            "id": tool_call.get("id", ""),
            "name": function.get("name", ""),
            "input": json.loads(function.get("arguments", "{}"))
        })
    
    anthropic_response = {
        "id": openai_response.get("id", ""),
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": content_blocks if content_blocks else [{"type": "text", "text": ""}],
        "stop_reason": "end_turn" if choice.get("finish_reason") == "stop" else choice.get("finish_reason", "end_turn"),
        "stop_sequence": None,
        "usage": {
            "input_tokens": openai_response.get("usage", {}).get("prompt_tokens", 0),
            "output_tokens": openai_response.get("usage", {}).get("completion_tokens", 0)
        }
    }
    
    # 添加必要的环境信息
    anthropic_response["environment"] = {
        "is_price_warning_shown": False
    }
    
    return anthropic_response

@app.post("/v1/messages")
async def messages(request: Request):
    """处理 Anthropic 格式的 /v1/messages 请求"""
    # 验证 API Key
    auth_header = request.headers.get("authorization", "") or request.headers.get("x-api-key", "")
    if auth_header.replace("Bearer ", "") != PROXY_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # 解析请求
    anthropic_request = await request.json()
    model = anthropic_request.get("model", "qianfan-code-latest")
    stream = anthropic_request.get("stream", False)
    
    # 转换请求格式
    openai_request = convert_anthropic_to_openai(anthropic_request)
    
    # 发送到后端
    async with httpx.AsyncClient(timeout=300.0) as client:
        headers = {
            "Authorization": f"Bearer {BACKEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        if stream:
            # 流式响应
            async def stream_generator():
                async with client.stream(
                    "POST",
                    f"{BACKEND_URL}/chat/completions",
                    headers=headers,
                    json=openai_request
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                yield f"data: [DONE]\n\n"
                                break
                            try:
                                chunk = json.loads(data)
                                # 转换为 Anthropic 流式格式
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    anthropic_chunk = {
                                        "type": "content_block_delta",
                                        "index": 0,
                                        "delta": {"type": "text_delta", "text": content}
                                    }
                                    yield f"event: content_block_delta\ndata: {json.dumps(anthropic_chunk)}\n\n"
                            except json.JSONDecodeError:
                                continue
                    yield "event: message_stop\ndata: {}\n\n"
            
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
        else:
            # 非流式响应
            response = await client.post(
                f"{BACKEND_URL}/chat/completions",
                headers=headers,
                json=openai_request
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            openai_response = response.json()
            anthropic_response = convert_openai_to_anthropic(openai_response, model)
            
            return JSONResponse(content=anthropic_response)

@app.get("/v1/models")
async def models():
    """返回可用模型列表"""
    return {
        "data": [
            {"id": "claude-3-5-sonnet-20241022", "object": "model", "created": 1677610602, "owned_by": "openclaw"},
            {"id": "claude-3-5-sonnet", "object": "model", "created": 1677610602, "owned_by": "openclaw"},
            {"id": "qianfan-code-latest", "object": "model", "created": 1677610602, "owned_by": "baidu"}
        ],
        "object": "list"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("🦞 OpenClaw Claude Code Proxy starting on http://localhost:4000")
    uvicorn.run(app, host="0.0.0.0", port=4000)
