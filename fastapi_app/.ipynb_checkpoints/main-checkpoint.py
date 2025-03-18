from fastapi import FastAPI, HTTPException, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import bcrypt
import asyncpg
from database import get_db
from contextlib import asynccontextmanager
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)

# ✅ 用户注册数据模型
class UserCreate(BaseModel):
    name: str
    email: EmailStr  # 强制邮箱格式验证
    password: str

# ✅ 用户登录数据模型
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ✅ 先定义 lifespan 让 FastAPI 正确加载
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 应用启动时创建数据库连接池
    app.state.db_pool = await get_db()
    yield
    # 应用关闭时释放连接池
    await app.state.db_pool.close()

# ✅ 现在定义 `app`
app = FastAPI(lifespan=lifespan)

# ✅ 添加 CORS 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 用户注册 API
@app.post("/register")
async def register_user(request: Request, user: UserCreate = Body(...)):
    try:
        # 记录原始请求体
        raw_body = await request.body()
        logging.info(f"Raw request body: {raw_body.decode()}")

        # 密码哈希
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

        return {
            "message": "用户注册成功",
            "user_id": str(result["user_id"]),
            "created_at": result["created_at"].isoformat()
        }
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

# ✅ 用户登录 API
@app.post("/login")
async def login_user(user: UserLogin = Body(...)):
    try:
        async with app.state.db_pool.acquire() as conn:
            db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", user.email)

            if not db_user:
                raise HTTPException(status_code=400, detail="邮箱未注册")

            # 验证哈希密码
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

# ✅ 主页测试 API
@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Backend!"}
