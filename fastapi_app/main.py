import os
import logging
import bcrypt
import asyncpg
from fastapi import FastAPI, HTTPException, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from database import get_db
from contextlib import asynccontextmanager

# 配置日志
logging.basicConfig(level=logging.INFO)

# 用户注册数据模型
class UserCreate(BaseModel):
    name: str
    email: EmailStr  # 强制邮箱格式验证
    password: str

# 用户登录数据模型
class UserLogin(BaseModel):
    email: EmailStr
    password: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.db_pool = await get_db()
        if not app.state.db_pool:
            raise Exception("数据库连接失败")
        logging.info("✅ 数据库连接池创建成功！")
        yield
    finally:
        if app.state.db_pool:
            await app.state.db_pool.close()
            logging.info("✅ 数据库连接已关闭")

# **创建 FastAPI 应用**
app = FastAPI(lifespan=lifespan)

# **修正静态文件挂载路径**
STATIC_DIR = "/home/thintuit/code/WebSite-Thintuit/static"
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")  # 挂载 static 目录到 /static
    logging.info(f"✅ 成功挂载静态目录: {STATIC_DIR}")
else:
    logging.error(f"❌ 错误：静态目录 {STATIC_DIR} 不存在！请检查路径。")

# **添加 CORS 允许跨域**
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://data.thintuit.com"],  # 保持与前端一致
    allow_credentials=True,  # 允许携带 Cookie
    allow_methods=["POST", "OPTIONS"],   # 限制允许的方法
    allow_headers=["*"], # "Content-Type", "Authorization"],  # 明确允许的标头
    expose_headers=["X-Custom-Header"]  # 暴露自定义标头（可选）
)

# **用户注册 API**
@app.post("/api/register")
async def register_user(request: Request, user: UserCreate = Body(...)):
    try:
        logging.info(f"📩 收到注册请求: {user.email}")
        
        raw_body = await request.body()
        logging.debug(f"Raw request body: {raw_body.decode()}")

        hashed_password = bcrypt.hashpw(
            user.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        async with app.state.db_pool.acquire() as conn:
            result = await conn.fetchrow(
                """INSERT INTO users (name, email, password)
                   VALUES ($1, $2, $3)
                   RETURNING user_id, created_at""",
                user.name, user.email, hashed_password
            )

        logging.info(f"✅ 用户 {user.email} 注册成功！")

        return {
            "message": "用户注册成功",
            "user_id": str(result["user_id"]),
            "created_at": result["created_at"].isoformat()
        }
    except asyncpg.exceptions.UniqueViolationError:
        logging.warning(f"⚠️ 该邮箱已被注册: {user.email}")
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    except Exception as e:
        logging.error(f"❌ 注册失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="服务器内部错误")

# **用户登录 API**
@app.post("/api/login")
async def login_user(user: UserLogin = Body(...)):
    try:
        async with app.state.db_pool.acquire() as conn:
            db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", user.email)

            if not db_user:
                raise HTTPException(status_code=400, detail="邮箱未注册")

            if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"].encode('utf-8')):
                raise HTTPException(status_code=400, detail="密码错误")

            return {
                "message": "登录成功",
                "user": {
                    "id": str(db_user["user_id"]),
                    "name": db_user["name"],
                    "email": db_user["email"]
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

# **主页测试 API**
@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Backend!"}
#test