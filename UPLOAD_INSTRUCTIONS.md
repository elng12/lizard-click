# 🚀 文件上传指南

## 📋 必须上传的文件

### 1. sitemap.xml (最重要！)
**当前问题**: 服务器上的sitemap.xml还是旧域名
**解决方案**: 重新上传本地的sitemap.xml文件

### 2. index.html
**更新内容**: 
- 域名已更新为 lizardbutton.click
- 关键词密度已优化
- SEO标签已完善

### 3. robots.txt
**内容**: 指向正确的sitemap URL

## 🌐 上传方式

### 方式1: FTP/SFTP客户端
1. 打开你的FTP客户端 (FileZilla, WinSCP等)
2. 连接到服务器
3. 进入网站根目录 (通常是 /public_html/ 或 /www/)
4. 上传以下文件:
   - sitemap.xml (覆盖现有文件)
   - index.html (覆盖现有文件)
   - robots.txt (如果没有则新建)

### 方式2: 托管服务商文件管理器
1. 登录你的托管服务商控制面板
2. 找到"文件管理器"或"File Manager"
3. 进入网站根目录
4. 上传或替换文件

### 方式3: cPanel文件管理器
1. 登录cPanel
2. 点击"文件管理器"
3. 进入public_html目录
4. 上传文件

## ✅ 上传后验证

### 1. 检查sitemap.xml
访问: https://lizardbutton.click/sitemap.xml
应该显示: `<loc>https://lizardbutton.click/</loc>`
不应该显示: `<loc>https://lizardclick.online/</loc>`

### 2. 检查主页
访问: https://lizardbutton.click/
确认页面正常加载

### 3. 检查robots.txt
访问: https://lizardbutton.click/robots.txt
确认包含: `Sitemap: https://lizardbutton.click/sitemap.xml`

## 🔧 Google Search Console 操作

上传完成后:
1. 登录 Google Search Console
2. 选择 lizardbutton.click 属性
3. 进入"站点地图"部分
4. 删除旧的sitemap (如果有错误状态)
5. 添加: https://lizardbutton.click/sitemap.xml
6. 点击"提交"

## 🚨 常见问题

### 如果sitemap还是显示旧域名:
1. 确认文件确实已上传
2. 清除浏览器缓存 (Ctrl+F5)
3. 等待5-10分钟让服务器更新
4. 检查文件权限 (应该是644)

### 如果上传失败:
1. 检查FTP连接信息
2. 确认有写入权限
3. 联系托管服务商技术支持

---
**重要**: 一定要确认sitemap.xml文件中的域名是 lizardbutton.click 而不是 lizardclick.online！