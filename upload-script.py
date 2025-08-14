#!/usr/bin/env python3
"""
简单的FTP上传脚本
使用前请安装: pip install ftplib
"""

import ftplib
import os

# 配置信息 (请填写你的服务器信息)
FTP_HOST = "your-ftp-server.com"  # 你的FTP服务器地址
FTP_USER = "your-username"        # 你的FTP用户名
FTP_PASS = "your-password"        # 你的FTP密码
FTP_DIR = "/public_html/"         # 网站根目录路径

# 需要上传的文件
FILES_TO_UPLOAD = [
    "sitemap.xml",
    "index.html", 
    "robots.txt"
]

def upload_files():
    try:
        # 连接FTP服务器
        print("连接FTP服务器...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        
        # 切换到网站目录
        ftp.cwd(FTP_DIR)
        
        # 上传文件
        for filename in FILES_TO_UPLOAD:
            if os.path.exists(filename):
                print(f"上传 {filename}...")
                with open(filename, 'rb') as file:
                    ftp.storbinary(f'STOR {filename}', file)
                print(f"✅ {filename} 上传成功")
            else:
                print(f"❌ 文件 {filename} 不存在")
        
        ftp.quit()
        print("🎉 所有文件上传完成！")
        
    except Exception as e:
        print(f"❌ 上传失败: {e}")

if __name__ == "__main__":
    print("🚀 开始上传文件到服务器...")
    upload_files()