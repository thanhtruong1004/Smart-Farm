from fastapi import APIRouter
from .endpoints import configs, actions

api_router = APIRouter()
api_router.include_router(configs.router, tags=["Configs"])
api_router.include_router(actions.router, tags=["Actions"])
