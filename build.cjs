/**
 * OpenClaw Sidekick - 构建脚本
 * 用于打包和发布扩展
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const config = {
  name: 'openclaw-sidekick',
  version: '0.2.0',
  srcDir: 'src',
  distDir: 'dist',
  assetsDir: 'assets'
};

// 清理 dist 目录
function clean() {
  console.log('🧹 清理...');
  if (fs.existsSync(config.distDir)) {
    fs.rmSync(config.distDir, { recursive: true });
  }
  fs.mkdirSync(config.distDir, { recursive: true });
}

// 复制文件
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 构建
function build() {
  console.log('🔨 构建中...');
  
  // 复制源代码
  copyDir(config.srcDir, path.join(config.distDir, 'src'));
  copyDir(config.assetsDir, path.join(config.distDir, 'assets'));
  
  // 复制配置文件
  fs.copyFileSync('manifest.json', path.join(config.distDir, 'manifest.json'));
  fs.copyFileSync('package.json', path.join(config.distDir, 'package.json'));
  fs.copyFileSync('README.md', path.join(config.distDir, 'README.md'));
  fs.copyFileSync('LICENSE', path.join(config.distDir, 'LICENSE'));
  
  console.log('✅ 构建完成');
}

// 压缩为 ZIP
function zip() {
  console.log('📦 打包中...');
  
  const outputName = `${config.name}-v${config.version}.zip`;
  
  if (fs.existsSync(outputName)) {
    fs.unlinkSync(outputName);
  }
  
  execSync(`zip -r ${outputName} ${config.distDir}`, { stdio: 'inherit' });
  
  console.log(`✅ 已打包为 ${outputName}`);
}

// 运行测试
function test() {
  console.log('🧪 运行测试...');
  
  try {
    execSync('node tests/run.js', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ 所有测试通过');
  } catch (e) {
    console.log('❌ 测试失败');
    process.exit(1);
  }
}

// 代码检查
function lint() {
  console.log('🔍 代码检查...');
  
  try {
    execSync('npx eslint src/', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ 代码检查通过');
  } catch (e) {
    console.log('⚠️ 代码检查有警告');
  }
}

// 发布
function publish() {
  console.log('🚀 发布中...');
  
  // 这里可以添加发布到 Chrome Web Store 的逻辑
  console.log('请手动上传到 Chrome Web Store Developer Dashboard');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  
  console.log(`📦 ${config.name} v${config.version}`);
  console.log('================================\n');
  
  switch (command) {
    case 'clean':
      clean();
      break;
    case 'build':
      clean();
      build();
      break;
    case 'test':
      test();
      break;
    case 'lint':
      lint();
      break;
    case 'zip':
      clean();
      build();
      zip();
      break;
    case 'publish':
      clean();
      build();
      test();
      zip();
      publish();
      break;
    default:
      console.log(`未知命令: ${command}`);
      console.log('可用命令: clean, build, test, lint, zip, publish');
  }
}

main();