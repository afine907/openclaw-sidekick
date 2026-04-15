# Freqtrade 学习笔记

**学习日期**: 2026-04-13

## 📌 简介

Freqtrade 是一个**开源加密货币交易机器人**，用 Python 编写。

- **GitHub**: https://github.com/freqtrade/freqtrade
- **文档**: https://www.freqtrade.io/en/stable/
- **Discord**: https://discord.gg/p7nuUNVfP7

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| **策略开发** | 用 Python + pandas 编写策略 |
| **数据下载** | 下载交易所历史数据 |
| **回测** | 在历史数据上测试策略 |
| **优化** | 超参数优化 + 机器学习 |
| **实盘运行** | Dry-Run 模拟 / Live-Trade 实盘 |
| **控制监控** | Telegram / WebUI |
| **数据分析** | SQL 数据库 + 可视化 |

## 🏪 支持的交易所

### 现货 (Spot)
- Binance, Bybit, OKX, Kraken, Gate.io, Bitget, Bitmart, HTX, BingX, Hyperliquid (DEX)

### 合约 (Futures)
- Binance, Bybit, OKX, Gate.io, Bitget, Kraken Futures, Hyperliquid

## 💻 安装方式

### 1. Docker（推荐）

```bash
# 下载
git clone https://github.com/freqtrade/freqtrade.git
cd freqtrade

# 使用 Docker
docker-compose up -d
```

### 2. 脚本安装（Linux/macOS）

```bash
# 安装依赖
sudo apt-get update
sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl

# 克隆仓库
git clone https://github.com/freqtrade/freqtrade.git
cd freqtrade

# 运行安装脚本
./setup.sh -i

# 激活虚拟环境
source .venv/bin/activate
```

### 3. Conda 安装

```bash
conda create --name freqtrade python=3.12
conda activate freqtrade

git clone https://github.com/freqtrade/freqtrade.git
cd freqtrade

pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
```

## 🚀 快速开始

```bash
# 1. 创建用户目录
freqtrade create-userdir --userdir user_data

# 2. 创建配置文件
freqtrade new-config --config user_data/config.json

# 3. 启动机器人（Dry-Run 模式）
freqtrade trade --config user_data/config.json --strategy SampleStrategy
```

## ⚙️ 系统要求

### 硬件
- 2GB RAM（最低）
- 1GB 磁盘空间
- 2vCPU

### 软件
- Python 3.11+
- pip / git
- TA-Lib（技术分析库）
- virtualenv（推荐）

## 📁 项目结构

```
freqtrade/
├── user_data/
│   ├── config.json      # 配置文件
│   ├── strategies/      # 策略文件
│   ├── data/           # 历史数据
│   └── logs/           # 日志
├── .venv/              # 虚拟环境
└── setup.sh            # 安装脚本
```

## 📚 常用命令

```bash
# 创建用户目录
freqtrade create-userdir --userdir user_data

# 创建配置
freqtrade new-config --config user_data/config.json

# 下载历史数据
freqtrade download-data --exchange binance --pairs BTC/USDT ETH/USDT

# 回测策略
freqtrade backtesting --config user_data/config.json --strategy MyStrategy

# 启动交易
freqtrade trade --config user_data/config.json --strategy MyStrategy

# 策略优化
freqtrade hyperopt --config user_data/config.json --hyperopt-loss SharpeHyperOptLoss --epochs 100
```

## ⚠️ 注意事项

1. **先 Dry-Run**: 实盘前必须先用模拟模式测试
2. **风险自负**: 加密货币交易有风险，可能损失资金
3. **基础要求**: 需要基本的 Python 编程能力
4. **时钟同步**: 系统时钟必须准确（NTP 同步）
5. **ARM64 系统**: 推荐使用 Docker

## 🔗 相关资源

- [策略仓库](https://github.com/freqtrade/freqtrade-strategies/)
- [FTUI - 终端 UI](https://github.com/freqtrade/ftui)
- [分析 Notebook](https://github.com/froggleston/freqtrade_analysis_notebook)
