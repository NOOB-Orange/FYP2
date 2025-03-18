import asyncpg

DB_CONFIG = {
    "host": "dev.thintuit.com",
    "port": "5432",
    "database": "thintuit",
    "user": "thintuit",
    "password": "28d931dcb192"
}

async def get_db():
    return await asyncpg.create_pool(
        min_size=5,
        max_size=20,
        **DB_CONFIG
    )