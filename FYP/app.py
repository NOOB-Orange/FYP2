from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 模拟的用户数据存储（在内存中）
users = []

# 首页（可选）
@app.route('/')
def index():
    return '后端服务器运行正常'

# 注册接口
@app.route('/register', methods=['POST'])
def register():
    # 根据前端发送的数据格式获取数据
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    username = data.get('username')
    password = data.get('password')

    # 检查用户名是否已存在
    if any(user['username'] == username for user in users):
        return jsonify({'message': '用户已存在'}), 400

    # 添加新用户
    users.append({'username': username, 'password': password})
    return jsonify({'message': '注册成功'}), 200

# 登录接口
@app.route('/login', methods=['POST'])
def login():
    # 根据前端发送的数据格式获取数据
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    username = data.get('username')
    password = data.get('password')

    # 验证用户
    user = next((user for user in users if user['username'] == username and user['password'] == password), None)
    if user:
        return jsonify({'message': '登录成功', 'username': username}), 200
    else:
        return jsonify({'message': '用户名或密码错误'}), 400

# 微信登录接口（跳转到微信授权页面）
@app.route('/wechat_login')
def wechat_login():
    appid = 'wxb9f21c0365e21bca'  # 替换为您的微信AppID
    redirect_uri = 'http://thintuit.cn/WeChat/callback'  # 替换为您的回调URL
    redirect_uri = redirect_uri  # 如果需要URL编码，请使用urllib.parse.quote_plus()
    state = 'YOUR_STATE'  # 可选参数

    wechat_auth_url = f'https://open.weixin.qq.com/connect/qrconnect?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_login&state={state}#wechat_redirect'

    return redirect(wechat_auth_url)

# 微信回调接口
@app.route('/wechat_callback')
def wechat_callback():
    code = request.args.get('code')
    state = request.args.get('state')

    if code:
        # 使用code获取access_token和用户信息（需要请求微信API）
        # 这里只是示例，实际需要后端与微信服务器交互
        # 假设获取到了用户信息，添加或更新用户
        username = 'wechat_user'  # 假设的微信用户名

        if not any(user['username'] == username for user in users):
            users.append({'username': username, 'password': ''})

        # 登录成功，重定向到前端页面，带上用户名（可选）
        return redirect(f'/welcome?username={username}')
    else:
        return '微信登录失败', 400

if __name__ == '__main__':
    app.run(debug=True)
