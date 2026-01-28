# ELK Plugin
# Provides access to ELK stack and Kibana dashboard


from fastapi import APIRouter
from pydantic import BaseModel

# Create the API router
api_router = APIRouter(prefix="/kibana", tags=["Kibana"])

# Request model
class KibanaRequest(BaseModel):
    # name: type
    pass


'''
Endpoints needed:
    - Need to grab Kibana URL
'''
# API endpoints
@api_router.get("/")
async def kibana_info():
    return {"name": "Kibana Plugin"}

@api_router.get("/url")
async def get_kibana_url():
    kibana_url = ''
    return {"url": kibana_url}