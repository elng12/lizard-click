const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  
  // 默认提供index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 构建文件路径
  const filePath = path.join(__dirname, pathname);
  
  // 获取文件扩展名
  const extname = path.extname(filePath);
  
  // 设置默认Content-Type
  let contentType = 'application/octet-stream';
  
  // 根据扩展名设置Content-Type
  switch (extname) {
    case '.html':
      contentType = 'text/html; charset=utf-8';
      break;
    case '.js':
      contentType = 'application/javascript; charset=utf-8';
      break;
    case '.css':
      contentType = 'text/css; charset=utf-8';
      break;
    case '.wav':
      contentType = 'audio/wav';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
  }
  
  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>404 - 文件未找到</h1><p>文件: ' + pathname + '</p></body></html>');
      } else {
        // 服务器错误
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>500 - 服务器错误</h1><p>' + err.message + '</p></body></html>');
      }
    } else {
      // 成功响应
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log('按 Ctrl+C 停止服务器');
});