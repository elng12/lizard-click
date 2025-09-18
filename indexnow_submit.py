# IndexNow 主动推送脚本
# 需将API密钥替换为你在Bing等平台申请的IndexNow密钥
import requests
import json

API_KEY = "YOUR_INDEXNOW_KEY"  # 请替换为你的IndexNow密钥
ENDPOINT = "https://api.indexnow.org/indexnow"

# 需要提交的URL列表
URLS = [
    "https://lizardbutton.click/",
    "https://lizardbutton.click/game.html"
]

payload = {
    "host": "lizardbutton.click",
    "key": API_KEY,
    "urlList": URLS
}

headers = {"Content-Type": "application/json"}

response = requests.post(ENDPOINT, data=json.dumps(payload), headers=headers)

print("IndexNow提交状态：", response.status_code)
print("返回内容：", response.text)
