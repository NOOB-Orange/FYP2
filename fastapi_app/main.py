import os
import logging
import bcrypt
import asyncpg
from fastapi import FastAPI, HTTPException, Depends, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from contextlib import asynccontextmanager
from fastapi import Request, HTTPException, Depends
from fastapi import APIRouter
from decimal import Decimal


# ✅ 日志配置
logging.basicConfig(level=logging.INFO)

router = APIRouter()

# ✅ 数据模型定义
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ✅ 数据库配置
DB_CONFIG = {
    "host": "dev.thintuit.com",
    "port": "5432",
    "database": "thintuit",
    "user": "thintuit",
    "password": "28d931dcb192"
}

# ✅ 数据库连接池
async def get_db():
    try:
        return await asyncpg.create_pool(**DB_CONFIG)
    except asyncpg.PostgresError as e:
        logging.error(f"数据库连接失败: {e}")
    except Exception as e:
        logging.error(f"发生未知错误: {e}")
    return None

async def get_user_by_id(user_id: str, conn):
    user = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

async def admin_only(request: Request):
    user_id = request.query_params.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="未提供用户ID")
    
    async with request.app.state.db_pool.acquire() as conn:
        user = await get_user_by_id(user_id, conn)
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="无权限访问（需要管理员）")
    return user

# ✅ 应用生命周期管理
async def lifespan(app: FastAPI):
    db_pool = await get_db()
    if not db_pool:
        logging.error("数据库连接失败")
    else:
        app.state.db_pool = db_pool
        logging.info("✅ 数据库连接成功")
    try:
        yield
    finally:
        if db_pool:
            await db_pool.close()
            logging.info("✅ 数据库连接已关闭")

# ✅ 创建 FastAPI 应用
app = FastAPI(lifespan=lifespan)

# ✅ 页面直达接口（避免静态路由冲突）
@app.get("/register", include_in_schema=False)
async def serve_register_page():
    return FileResponse("/mnt/local/shared/WebSite-Thintuit/public/register/index.html")

# ✅ 修正静态文件路径挂载，挂载到 /static 避免与 API 冲突
STATIC_DIR = "/home/thintuit/code/WebSite-Thintuit/public"
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    logging.info(f"✅ 成功挂载静态目录到 /static: {STATIC_DIR}")
else:
    logging.error(f"❌ 静态目录 {STATIC_DIR} 不存在！请检查路径。")

# ✅ 跨域设置，支持来自 Apache 提供的前端页面访问 API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://data.thintuit.com", "http://data.thintuit.com",
        "https://dev.thintuit.com", "http://dev.thintuit.com",  # ✅ 加上这一行！
        "http://localhost:41284", "https://localhost:41284"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# **用户注册 API**
@app.post("/register")
async def register_user(request: Request, user: UserCreate = Body(...)):
    try:
        logging.info(f"📩 收到注册请求: {user.email}")
        
        raw_body = await request.body()
        logging.debug(f"Raw request body: {raw_body.decode()}")

        # 确保密码安全性
        if len(user.password) < 6:
            logging.warning(f"⚠️ 密码太短: {user.email}")
            raise HTTPException(status_code=400, detail="密码至少需要6个字符")

        try:
            # 使用bcrypt加密密码
            hashed_password = bcrypt.hashpw(
                user.password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            logging.debug(f"密码加密完成")
        except Exception as e:
            logging.error(f"❌ 密码加密失败: {str(e)}")
            raise HTTPException(status_code=500, detail="密码加密失败")

        async with app.state.db_pool.acquire() as conn:
            try:
                # 先检查用户是否已存在
                existing_user = await conn.fetchrow(
                    "SELECT email FROM users WHERE email = $1", 
                    user.email
                )
                
                if existing_user:
                    logging.warning(f"⚠️ 该邮箱已被注册: {user.email}")
                    raise HTTPException(status_code=400, detail="该邮箱已被注册")
                
                # 插入新用户
                result = await conn.fetchrow(
                    """INSERT INTO users (name, email, password, role)
                       VALUES ($1, $2, $3, 'normal')
                       RETURNING user_id, created_at""",
                    user.name, user.email, hashed_password
                )
                
                logging.info(f"✅ 用户 {user.email} 注册成功！ID: {result['user_id']}")

                # 返回成功消息和用户信息
                return {
                    "success": True,
                    "message": "注册成功",
                    "user_id": str(result["user_id"])
                }

            except asyncpg.exceptions.UniqueViolationError:
                logging.warning(f"⚠️ 该邮箱已被注册: {user.email}")
                raise HTTPException(status_code=400, detail="该邮箱已被注册")
            except Exception as db_error:
                logging.error(f"❌ 数据库操作失败: {str(db_error)}")
                raise HTTPException(status_code=500, detail=f"数据库操作失败: {str(db_error)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ 注册失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

# **用户登录 API**
@app.post("/login")
async def login_user(user: UserLogin = Body(...)):
    try:
        logging.info(f"📩 收到登录请求: {user.email}")
        
        async with app.state.db_pool.acquire() as conn:
            db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", user.email)

            if not db_user:
                logging.warning(f"⚠️ 邮箱未注册: {user.email}")
                raise HTTPException(status_code=400, detail="邮箱未注册")

            # 打印调试信息
            logging.info(f"🔍 用户信息: {db_user}")
            
            # 修正字段名称 - 根据实际数据库字段
            user_id_field = "user_id"  # 将 u39r_id 修改为 user_id
            if user_id_field not in db_user:
                logging.error(f"❌ 数据库字段错误: {user_id_field} 不存在")
                # 尝试自动检测正确的字段名
                possible_id_fields = [k for k in db_user.keys() if 'id' in k.lower()]
                if possible_id_fields:
                    user_id_field = possible_id_fields[0]
                    logging.info(f"✅ 自动检测到可能的ID字段: {user_id_field}")
            
            try:
                # 检查密码 - 尝试bcrypt验证
                stored_password = db_user["password"]
                valid_password = False
                
                # 首先尝试标准的bcrypt验证
                try:
                    valid_password = bcrypt.checkpw(user.password.encode('utf-8'), stored_password.encode('utf-8'))
                except ValueError as salt_error:
                    logging.warning(f"⚠️ bcrypt验证失败，可能密码未正确加密: {salt_error}")
                    
                    # 如果是测试环境或演示账户，临时允许简单验证
                    # 警告：这是临时措施，生产环境应移除
                    if stored_password == "hashed_pwd" or user.password == stored_password:
                        logging.warning("⚠️ 使用临时密码验证方式")
                        valid_password = True
                
                if not valid_password:
                    logging.warning(f"⚠️ 密码错误: {user.email}")
                    raise HTTPException(status_code=400, detail="密码错误")
                
                logging.info(f"✅ 用户 {user.email} 登录成功！")
                
                return {
                    "success": True,
                    "message": "登录成功",
                    "user": {
                        "id": str(db_user[user_id_field]),
                        "name": db_user["name"],
                        "email": db_user["email"],
                        "role": db_user["role"]
                    },
                    "redirect_url": "/dashboard/"
                }
                
            except ValueError as e:
                logging.error(f"❌ 密码验证错误: {str(e)}")
                raise HTTPException(status_code=500, detail=f"密码验证错误: {str(e)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ 登录失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")
    
@app.get("/dashboard", include_in_schema=False)
async def serve_dashboard():
    return FileResponse("/home/thintuit/code/WebSite-Thintuit/public/dashboard/index.html")

@app.get("/user/info")
async def get_user_info(request: Request):
    try:
        # 这里应该有用户认证逻辑，例如从cookie或令牌获取用户ID
        # 临时模拟：从查询参数中获取用户ID（实际应使用会话或JWT）
        user_id = request.query_params.get("user_id")
        
        if not user_id:
            logging.warning("⚠️ 获取用户信息失败: 未提供用户ID")
            raise HTTPException(status_code=401, detail="未授权，请重新登录")
        
        logging.info(f"📩 获取用户信息请求: ID {user_id}")
        
        async with app.state.db_pool.acquire() as conn:
            user = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            
            if not user:
                logging.warning(f"⚠️ 用户ID不存在: {user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
            
            # 从用户记录中移除密码
            user_dict = dict(user)
            user_dict.pop("password", None)
            
            logging.info(f"✅ 成功获取用户 {user_dict.get('email')} 的信息")
            
            return {
                "success": True,
                "user": user_dict
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ 获取用户信息失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.get("/admin/users")
async def list_all_users(user=Depends(admin_only)):
    async with app.state.db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC")
        return {
            "success": True,
            "users": [dict(row) for row in rows]
        }

@app.get("/visualization", include_in_schema=False)
async def serve_visualization():
    return FileResponse("/home/thintuit/code/WebSite-Thintuit/public/visualization/index.html")

@app.get("/api/accuracy")
async def get_model_accuracy(request: Request):
    try:
        async with request.app.state.db_pool.acquire() as conn:
            records = await conn.fetch("""
                SELECT
                  model_id,
                  correct_category,
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE ml_category_final = correct_category) AS correct,
                  ROUND(
                    COUNT(*) FILTER (WHERE ml_category_final = correct_category)::NUMERIC / COUNT(*) * 100, 2
                  ) AS accuracy_percent
                FROM testrecordsdetails2022
                GROUP BY model_id, correct_category
                ORDER BY correct_category, model_id;
            """)

            # ✅ 手动转 float，确保 JSON 能序列化
            data = []
            for r in records:
                row = dict(r)
                if isinstance(row["accuracy_percent"], Decimal):
                    row["accuracy_percent"] = float(row["accuracy_percent"])
                data.append(row)

            return JSONResponse(content=data)

    except Exception as e:
        import logging
        logging.error(f"获取准确率数据失败: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "内部服务器错误", "detail": str(e)})

# ✅ 别忘了注册路由！
app.include_router(router)

@app.post("/logout")
async def logout_user():
    # 实际实现应该销毁会话或使JWT令牌失效
    # 这里只是一个基本响应
    return {"success": True, "message": "注销成功"}

@app.post("/change-password")
async def change_password(request: Request, body: dict = Body(...)):
    try:
        # 从请求中获取当前用户ID
        user_id = request.query_params.get("user_id")
        current_password = body.get("current_password")
        new_password = body.get("new_password")
        
        if not user_id or not current_password or not new_password:
            raise HTTPException(status_code=400, detail="缺少必要参数")
        
        if len(new_password) < 6:
            logging.warning(f"⚠️ 新密码太短")
            raise HTTPException(status_code=400, detail="密码至少需要6个字符")
        
        logging.info(f"📩 修改密码请求: 用户ID {user_id}")
        
        async with app.state.db_pool.acquire() as conn:
            # 获取用户当前密码
            user = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            
            if not user:
                logging.warning(f"⚠️ 用户ID不存在: {user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
            
            # 验证当前密码
            stored_password = user["password"]
            valid_password = False
            
            try:
                valid_password = bcrypt.checkpw(current_password.encode('utf-8'), stored_password.encode('utf-8'))
            except ValueError as salt_error:
                logging.warning(f"⚠️ bcrypt验证失败: {salt_error}")
                
                # 临时验证方式（仅用于测试）
                if stored_password == "hashed_pwd" or current_password == stored_password:
                    valid_password = True
            
            if not valid_password:
                logging.warning(f"⚠️ 当前密码错误: 用户ID {user_id}")
                raise HTTPException(status_code=400, detail="当前密码错误")
            
            # 加密新密码
            hashed_new_password = bcrypt.hashpw(
                new_password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            # 更新密码
            await conn.execute(
                "UPDATE users SET password = $1 WHERE user_id = $2",
                hashed_new_password, user_id
            )
            
            logging.info(f"✅ 用户 {user['email']} 密码修改成功")
            
            return {
                "success": True,
                "message": "密码修改成功"
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ 修改密码失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.delete("/delete-account")
async def delete_account(request: Request):
    try:
        # 从请求中获取当前用户ID
        user_id = request.query_params.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="缺少用户ID")
        
        logging.info(f"📩 删除账户请求: 用户ID {user_id}")
        
        async with app.state.db_pool.acquire() as conn:
            # 检查用户是否存在
            user = await conn.fetchrow("SELECT email FROM users WHERE user_id = $1", user_id)
            
            if not user:
                logging.warning(f"⚠️ 用户ID不存在: {user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
            
            # 删除用户
            await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)
            
            logging.info(f"✅ 成功删除用户: {user['email']}")
            
            return {
                "success": True,
                "message": "账户已成功删除"
            }
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ 删除账户失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")



# ✅ 根路径只返回 API 欢迎信息，避免冲突
@app.get("/")
async def root():
    return {"message": "Welcome to Thintuit API"}