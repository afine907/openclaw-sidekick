/**
 * 代码块组件 - 语法高亮 + 一键复制
 */

class CodeBlock {
  constructor() {
    this.languages = {
      javascript: ['js', 'javascript', 'jsx'],
      typescript: ['ts', 'typescript', 'tsx'],
      python: ['py', 'python'],
      java: ['java'],
      csharp: ['cs', 'csharp', 'c#'],
      cpp: ['cpp', 'c++', 'cc'],
      c: ['c', 'h'],
      go: ['go', 'golang'],
      rust: ['rs', 'rust'],
      ruby: ['rb', 'ruby'],
      php: ['php'],
      swift: ['swift'],
      kotlin: ['kt', 'kotlin'],
      sql: ['sql'],
      html: ['html', 'htm'],
      css: ['css', 'scss', 'sass', 'less'],
      json: ['json'],
      yaml: ['yaml', 'yml'],
      xml: ['xml'],
      markdown: ['md', 'markdown'],
      bash: ['sh', 'bash', 'shell', 'zsh'],
      powershell: ['ps1', 'powershell']
    };
  }

  // 检测代码语言
  detectLanguage(code) {
    const firstLine = code.trim().split('\n')[0].toLowerCase();

    // -shebang 检测
    if (firstLine.startsWith('#!')) {
      if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
      if (firstLine.includes('python')) return 'python';
      if (firstLine.includes('node')) return 'javascript';
    }

    // 关键词检测
    if (/^(import|export|const|let|var|function|class|interface|type)\s/m.test(code)) {
      if (/:\s*(string|number|boolean|any|void|never)\s*[=;,)]/m.test(code)) return 'typescript';
      if (/^from\s+['"]|^import\s+['"]/m.test(code)) return 'javascript';
    }

    if (/^(def|class|import|from|if __name__|print\()/m.test(code)) return 'python';

    if (/^(package|import|public|private|class|interface)\s/m.test(code)) {
      if (/System\.out\.print|println/m.test(code)) return 'java';
      return 'java';
    }

    if (/^package\s+\w+|^import\s+"/m.test(code)) return 'go';

    if (/^fn\s+\w+|^let\s+mut|^use\s+\w+::/m.test(code)) return 'rust';

    if (/^<!DOCTYPE|^<html|^<div|^<span/m.test(code)) return 'html';

    if (/^{\s*"|^\[|":\s*|":\s*\d/m.test(code)) return 'json';

    if (/^#|^-\s|^[\w-]+:/m.test(code)) return 'yaml';

    // 缩进检测
    const lines = code.split('\n');
    const hasTabs = lines.some(l => l.startsWith('\t'));
    if (hasTabs) {
      if (/\{|\}|;$/.test(code)) return 'javascript';
      if (/^\s{4}\S/m.test(code)) return 'python';
    }

    return 'plaintext';
  }

  // 简单语法高亮
  highlight(code, language) {
    const lang = language?.toLowerCase() || 'plaintext';

    // 关键字
    const keywords = [
      'const', 'let', 'var', 'function', 'class', 'interface', 'type',
      'import', 'export', 'from', 'return', 'if', 'else', 'for', 'while',
      'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
      'async', 'await', 'new', 'this', 'super', 'extends', 'implements',
      'public', 'private', 'protected', 'static', 'readonly', 'void',
      'def', 'elif', 'except', 'lambda', 'with', 'assert', 'yield'
    ];

    let highlighted = this.escapeHtml(code);

    // 字符串
    highlighted = highlighted.replace(
      /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
      '<span class="cb-string">$&</span>'
    );

    // 注释
    highlighted = highlighted.replace(
      /(\/\/.*$|#.*$)/gm,
      '<span class="cb-comment">$1</span>'
    );

    // 多行注释
    highlighted = highlighted.replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span class="cb-comment">$1</span>'
    );

    // 数字
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="cb-number">$1</span>'
    );

    // 关键字
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="cb-keyword">$1</span>');
    });

    return highlighted;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 渲染代码块
  render(code, language) {
    const lang = this.detectLanguage(code);
    const highlighted = this.highlight(code, lang);

    return `
      <div class="code-block" data-language="${lang}">
        <div class="code-block-header">
          <span class="code-block-language">${lang}</span>
          <button class="code-block-copy" title="复制代码">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>复制</span>
          </button>
        </div>
        <pre class="code-block-content"><code>${highlighted}</code></pre>
      </div>
    `;
  }

  // 初始化复制按钮事件
  initCopyButtons(container) {
    container.querySelectorAll('.code-block-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.closest('.code-block-content').textContent;
        try {
          await navigator.clipboard.writeText(code);
          btn.classList.add('copied');
          btn.querySelector('span').textContent = '已复制!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('span').textContent = '复制';
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      });
    });
  }
}

// 导出
window.CodeBlock = CodeBlock;