#!/bin/bash

# 设置环境变量
export PYTHONPATH=$PYTHONPATH:/home/thintuit/code

echo "启动 FastAPI 应用..."
echo "使用 uvicorn 在端口 41285 启动，允许外部访问"

# 启动 FastAPI 应用
cd /home/thintuit/code/WebSite-Thintuit/fastapi_app
uvicorn main:app --host 0.0.0.0 --port 41285 --proxy-headers