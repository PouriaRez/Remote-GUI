# ELK Plugin
# Provides access to ELK stack and Kibana dashboard

from fastapi import APIRouter
from pydantic import BaseModel
import os
# Create the API router
api_router = APIRouter(prefix="/kibana", tags=["Kibana"])

# Default Kibana URL
DEFAULT_KIBANA_URL = os.getenv("KIBANA_URL", "http://localhost:5601/app/dashboards")

# Request model
class KibanaRequest(BaseModel):
    url: str



# API endpoints
@api_router.get("/")
async def kibana_info():
    return {"name": "Kibana Plugin"}

@api_router.get("/url")
async def get_kibana_url():
    return {"url": DEFAULT_KIBANA_URL}