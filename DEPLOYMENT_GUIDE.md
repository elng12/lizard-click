# 🚀 Lizard Click 网站部署指南

## 📁 需要上传到服务器的文件

### ✅ 核心文件（必须上传）
```
/
├── index.html          # 主页面
├── script.js           # 游戏逻辑
├── styles.css          # 样式文件
├── sitemap.xml         # 站点地图（新增）
├── robots.txt          # 搜索引擎指引（新增）
├── favicon.ico         # 网站图标
└── lizard.wav          # 音频文件
```

### 📂 可选文件
```
├── images/             # 图片文件夹
├── README.md           # 项目说明
├── SEO_CHECKLIST.md    # SEO检查清单
└── AUDIO_SETUP.md      # 音频设置说明
```

## 🌐 部署步骤

### 1. 上传文件到服务器
使用FTP、SFTP或者你的托管服务商提供的文件管理器，将以下文件上传到网站根目录：

```bash
# 核心文件
index.html
script.js  
styles.css
lizard.wav
favicon.ico

# SEO文件（重要！）
sitemap.xml
robots.txt
```

### 2. 验证文件可访问性
上传完成后，在浏览器中测试以下URL：

- ✅ `https://lizardbutton.click/` - 主页
- ✅ `https://lizardbutton.click/sitemap.xml` - 站点地图
- ✅ `https://lizardbutton.click/robots.txt` - 搜索引擎指引
- ✅ `https://lizardbutton.click/lizard.wav` - 音频文件
- ✅ `https://lizardbutton.click/favicon.ico` - 网站图标

### 3. Google Search Console 设置
1. 登录 [Google Search Console](https://search.google.com/search-console/)
2. 选择你的网站属性 `lizardbutton.click`
3. 进入"站点地图"部分
4. 删除旧的sitemap（如果有错误状态）
5. 添加新的sitemap URL: `https://lizardbutton.click/sitemap.xml`
6. 点击"提交"

### 4. 测试网站功能
- ✅ 点击蜥蜴按钮是否有声音
- ✅ 点击计数是否正常
- ✅ 全局计数是否更新
- ✅ 移动端是否正常显示
- ✅ 所有导航链接是否工作

## 🔧 服务器配置建议

### MIME类型设置
确保服务器正确设置以下MIME类型：
```
.wav  -> audio/wav
.xml  -> application/xml
.txt  -> text/plain
.ico  -> image/x-icon
```

### 缓存设置
建议设置适当的缓存头：
```
# 静态资源缓存1年
.css, .js, .wav, .ico -> Cache-Control: max-age=31536000

# HTML文件缓存1小时
.html -> Cache-Control: max-age=3600

# XML和TXT文件缓存1天
.xml, .txt -> Cache-Control: max-age=86400
```

### HTTPS重定向
确保所有HTTP请求都重定向到HTTPS：
```
http://lizardbutton.click/* -> https://lizardbutton.click/*
```

## 📊 部署后验证清单

### ✅ 功能测试
- [ ] 网站正常加载
- [ ] 蜥蜴点击游戏工作正常
- [ ] 音频播放正常
- [ ] 统计数据更新正常
- [ ] 移动端响应式正常

### ✅ SEO验证
- [ ] sitemap.xml可访问
- [ ] robots.txt可访问
- [ ] Google Search Console无错误
- [ ] 页面在搜索结果中正常显示

### ✅ 性能检查
- [ ] 页面加载速度 < 3秒
- [ ] 音频文件加载正常
- [ ] 没有404错误
- [ ] 所有资源正确加载

## 🚨 常见问题解决

### 音频不播放
1. 检查 `lizard.wav` 文件是否上传
2. 检查文件路径是否正确
3. 检查服务器MIME类型设置

### sitemap无法访问
1. 确认 `sitemap.xml` 在根目录
2. 检查文件权限（644）
3. 验证XML格式是否正确

### 样式不显示
1. 检查 `styles.css` 文件路径
2. 确认CSS文件正确上传
3. 清除浏览器缓存

## 📞 技术支持
如果遇到问题，请检查：
1. 浏览器开发者工具的Console面板
2. Network面板查看资源加载情况
3. Google Search Console的错误报告

---
**部署完成后，记得在Google Search Console重新提交sitemap！**