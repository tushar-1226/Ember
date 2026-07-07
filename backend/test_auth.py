import requests

res = requests.get("http://localhost:8080/chats", headers={"Authorization": "Bearer invalid_token"})
print(res.status_code)
print(res.json())
