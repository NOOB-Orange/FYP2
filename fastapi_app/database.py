import asyncpg
import asyncio
import logging

DB_CONFIG = {
    "host": "dev.thintuit.com",
    "port": "5432",
    "database": "thintuit",
    "user": "thintuit",
    "password": "28d931dcb192"
}

async def get_db():
    try:
         await asyncpg.create_pool(**DB_CONFIG)
    except asyncpg.PostgresError as e:
        logging.error(f"数据库连接失败: {e}")
    except Exception as e:
        logging.error(f"发生未知错误: {e}")