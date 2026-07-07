import requests

res = requests.get("http://localhost:8080/chats")
print(res.status_code)
print(res.json())
