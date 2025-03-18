"""
    This is the Backend Server of Thintuit
"""
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    """
        entry point for test
    """
    return "Hello, World!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=41281)
