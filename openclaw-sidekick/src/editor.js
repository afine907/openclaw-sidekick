/**
 * OpenClaw Sidekick - 代码编辑器组件
 * 提供内置代码编辑和语法高亮功能
 */

// 代码编辑器
class CodeEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      language: options.language || 'javascript',
      theme: options.theme || 'monokai',
      fontSize: options.fontSize || 14,
      tabSize: options.tabSize || 2,
      lineNumbers: options.lineNumbers !== false,
      wordWrap: options.wordWrap !== false,
      autoClose: options.autoClose !== false,
      ...options
    };
    
    this.editor = null;
    this.content = '';
    this.history = [];
    this.historyIndex = -1;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="code-editor">
        <div class="editor-toolbar">
          <select class="language-select">${this.getLanguageOptions()}</select>
          <button class="btn-format">格式化</button>
          <button class="btn-copy">复制</button>
          <button class="btn-download">下载</button>
        </div>
        <div class="editor-content">
          <div class="line-numbers"></div>
          <textarea class="code-input" spellcheck="false"></textarea>
          <pre class="code-highlight"><code></code></pre>
        </div>
      </div>
    `;
    
    this.codeInput = this.container.querySelector('.code-input');
    this.highlight = this.container.querySelector('.code-highlight code');
    this.lineNumbers = this.container.querySelector('.line-numbers');
    
    this.bindEvents();
    this.updateLineNumbers();
  }

  getLanguageOptions() {
    const languages = [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'json', label: 'JSON' },
      { value: 'markdown', label: 'Markdown' },
      { value: 'sql', label: 'SQL' },
      { value: 'bash', label: 'Bash' },
      { value: 'rust', label: 'Rust' },
      { value: 'go', label: 'Go' },
      { value: 'java', label: 'Java' }
    ];
    
    return languages.map(l => 
      `<option value="${l.value}" ${l.value === this.options.language ? 'selected' : ''}>${l.label}</option>`
    ).join('');
  }

  bindEvents() {
    // 输入事件
    this.codeInput.addEventListener('input', () => {
      this.updateHighlight();
      this.updateLineNumbers();
      this.saveHistory();
    });

    // Tab 键
    this.codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.insertText('  ');
      }
    });

    // 快捷键
    this.codeInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.download();
      }
    });

    // 滚动同步
    this.codeInput.addEventListener('scroll', () => {
      this.highlight.parentElement.scrollTop = this.codeInput.scrollTop;
      this.lineNumbers.scrollTop = this.codeInput.scrollTop;
    });

    // 语言切换
    this.container.querySelector('.language-select').addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });

    // 工具栏按钮
    this.container.querySelector('.btn-format').addEventListener('click', () => this.format());
    this.container.querySelector('.btn-copy').addEventListener('click', () => this.copy());
    this.container.querySelector('.btn-download').addEventListener('click', () => this.download());
  }

  updateLineNumbers() {
    const lines = this.codeInput.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div class="line-number">${i}</div>`;
    }
    this.lineNumbers.innerHTML = html;
  }

  updateHighlight() {
    const code = this.codeInput.value;
    this.highlight.innerHTML = this.highlightCode(code);
    this.content = code;
  }

  highlightCode(code) {
    // 简单的高亮实现
    const language = this.options.language;
    
    // 转义 HTML
    code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // 关键词
    const keywords = {
      javascript: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|static|get|set)\b/g,
      python: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|raise|with|lambda|yield|global|nonlocal|pass|break|continue)\b/g,
      html: /<\/?[a-z][a-z0-9]*|>/gi,
      css: /[.#]?[a-z][a-z0-9_-]*/gi
    };
    
    // 字符串
    code = code.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="string">$&</span>');
    
    // 注释
    code = code.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="comment">$1</span>');
    
    // 数字
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    return code;
  }

  insertText(text) {
    const start = this.codeInput.selectionStart;
    const end = this.codeInput.selectionEnd;
    const value = this.codeInput.value;
    
    this.codeInput.value = value.substring(0, start) + text + value.substring(end);
    this.codeInput.selectionStart = this.codeInput.selectionEnd = start + text.length;
    
    this.updateHighlight();
    this.updateLineNumbers();
    this.saveHistory();
  }

  setLanguage(lang) {
    this.options.language = lang;
    this.updateHighlight();
  }

  getValue() {
    return this.codeInput.value;
  }

  setValue(code) {
    this.codeInput.value = code;
    this.updateHighlight();
    this.updateLineNumbers();
    this.saveHistory();
  }

  saveHistory() {
    // 移除当前位置之后的历史
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.codeInput.value);
    this.historyIndex = this.history.length - 1;
    
    // 限制历史长度
    if (this.history.length > 100) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.codeInput.value = this.history[this.historyIndex];
      this.updateHighlight();
      this.updateLineNumbers();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.codeInput.value = this.history[this.historyIndex];
      this.updateHighlight();
      this.updateLineNumbers();
    }
  }

  async format() {
    // 简单的格式化
    let code = this.codeInput.value;
    
    if (this.options.language === 'json') {
      try {
        const obj = JSON.parse(code);
        code = JSON.stringify(obj, null, this.options.tabSize);
      } catch (e) {
        console.error('Format error:', e);
      }
    }
    
    this.setValue(code);
  }

  async copy() {
    await navigator.clipboard.writeText(this.codeInput.value);
  }

  download() {
    const extensions = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      html: '.html',
      css: '.css',
      json: '.json',
      markdown: '.md',
      sql: '.sql',
      bash: '.sh',
      rust: '.rs',
      go: '.go',
      java: '.java'
    };
    
    const ext = extensions[this.options.language] || '.txt';
    const blob = new Blob([this.codeInput.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 语法高亮器
class SyntaxHighlighter {
  static highlight(code, language) {
    // 基础高亮
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 关键词
    const langConfig = this.getLanguageConfig(language);
    
    if (langConfig.keywords) {
      html = html.replace(
        new RegExp(`\\b(${langConfig.keywords.join('|')})\\b`, 'g'),
        '<span class="keyword">$1</span>'
      );
    }
    
    // 字符串
    html = html.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      '<span class="string">$&</span>'
    );
    
    // 数字
    html = html.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="number">$1</span>'
    );
    
    // 注释
    html = html.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
      '<span class="comment">$1</span>'
    );
    
    return html;
  }

  static getLanguageConfig(language) {
    const configs = {
      javascript: {
        keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'extends', 'static', 'get', 'set', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false']
      },
      python: {
        keywords: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'raise', 'with', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'self', 'print']
      },
      html: {
        keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option', 'textarea', 'label', 'iframe']
      },
      css: {
        keywords: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'flex', 'grid', 'font', 'text', 'line', 'overflow', 'z-index', 'opacity', 'transform', 'transition', 'animation']
      }
    };
    
    return configs[language] || { keywords: [] };
  }
}

// 代码片段管理器
class SnippetManager {
  constructor() {
    this.snippets = new Map();
    this.loadDefaultSnippets();
    this.loadUserSnippets();
  }

  loadDefaultSnippets() {
    const defaults = {
      'js-arrow': {
        name: 'Arrow Function',
        language: 'javascript',
        code: 'const fn = (params) => {\n  \n};'
      },
      'js-async': {
        name: 'Async Function',
        language: 'javascript',
        code: 'async function fn() {\n  try {\n    \n  } catch (e) {\n    console.error(e);\n  }\n}'
      },
      'py-def': {
        name: 'Function Definition',
        language: 'python',
        code: 'def function_name(params):\n    """Description"""\n    pass'
      },
      'py-class': {
        name: 'Class Definition',
        language: 'python',
        code: 'class ClassName:\n    def __init__(self):\n        pass\n    \n    def method(self):\n        pass'
      },
      'html-boilerplate': {
        name: 'HTML Boilerplate',
        language: 'html',
        code: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>'
      },
      'css-flex': {
        name: 'Flex Center',
        language: 'css',
        code: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}'
      }
    };

    for (const [id, snippet] of Object.entries(defaults)) {
      this.snippets.set(id, snippet);
    }
  }

  loadUserSnippets() {
    try {
      const saved = localStorage.getItem('openclaw_snippets');
      if (saved) {
        const userSnippets = JSON.parse(saved);
        for (const [id, snippet] of Object.entries(userSnippets)) {
          this.snippets.set(id, snippet);
        }
      }
    } catch (e) {
      console.error('Load snippets error:', e);
    }
  }

  saveUserSnippets() {
    const userSnippets = {};
    for (const [id, snippet] of this.snippets) {
      if (id.startsWith('user-')) {
        userSnippets[id] = snippet;
      }
    }
    localStorage.setItem('openclaw_snippets', JSON.stringify(userSnippets));
  }

  addSnippet(id, name, language, code) {
    this.snippets.set('user-' + id, { name, language, code });
    this.saveUserSnippets();
  }

  removeSnippet(id) {
    if (this.snippets.has(id)) {
      this.snippets.delete(id);
      this.saveUserSnippets();
    }
  }

  getSnippet(id) {
    return this.snippets.get(id);
  }

  listSnippets() {
    return Array.from(this.snippets.entries()).map(([id, s]) => ({
      id,
      name: s.name,
      language: s.language
    }));
  }

  searchSnippets(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [id, snippet] of this.snippets) {
      if (
        snippet.name.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ id, ...snippet });
      }
    }
    
    return results;
  }
}

// 导出
window.CodeEditor = CodeEditor;
window.SyntaxHighlighter = SyntaxHighlighter;
window.SnippetManager = SnippetManager;