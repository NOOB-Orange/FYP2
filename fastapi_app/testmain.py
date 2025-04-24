# test_main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/accuracy")
async def get_accuracy():
    return JSONResponse(content=[
        {"model_id": "ModelA", "correct_category": "可回收物", "accuracy_percent": 91.5},
        {"model_id": "ModelA", "correct_category": "厨余垃圾", "accuracy_percent": 87.0}
    ])

@app.get("/")
async def root():
    return {"message": "Test API is alive"}
