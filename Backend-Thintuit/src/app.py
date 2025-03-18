from flask import Flask, request, jsonify
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
# CORS(app)  # 允许所有来源的跨域请求

from flask_cors import CORS

# 配置允许的来源
CORS(app, resources={r"/*": {"origins": "*"}})


# 控制密码是否加密保存的变量
use_encryption = False

def get_db_connection():
    conn = psycopg2.connect(
        dbname="thintuit_db",
        user="thintuit",  # username & password for the database
        password="thintuit",  # username & password for the database
        host="localhost"
    )
    return conn

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = request.form['password']
    if use_encryption:
        password_to_store = generate_password_hash(password)  # 加密保存
    else:
        password_to_store = password  # 明文保存
    
    # with open("log.txt", "a") as f:
    #     f.write(f"[LOG] username: {username}\n")
    #     f.write(f"[LOG] password: {password_to_store}\n")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO users (username, password) VALUES (%s, %s)',
                    (username, password_to_store))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        if use_encryption:
            password_check = check_password_hash(user[2], password)
        else:
            password_check = user[2] == password

        if password_check:
            return jsonify({"message": "Login successful"}), 200

    return jsonify({"message": "Invalid username or password"}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=41281)
