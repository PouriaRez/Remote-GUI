from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import file_auth
from classes import UserSignupInfo, UserLoginInfo, AccessToken, BookmarkUpdateRequest, PresetGroup, PresetGroupID, Preset, PresetID

# Create router
file_auth_router = APIRouter(prefix="/auth", tags=["file-auth"])

@file_auth_router.post("/signup/")
def signup(info: UserSignupInfo):
    """Register a new user with file-based authentication"""
    print("Signup info:", info)
    response = file_auth.file_signup(info.email, info.password, info.firstname, info.lastname)
    
    print("Signup response:", response)
    if "error" in response:
        raise HTTPException(status_code=400, detail=response["error"])
    return {"data": response}

@file_auth_router.post("/login/")
def login(info: UserLoginInfo):
    """Authenticate a user with file-based authentication"""
    response = file_auth.file_login(info.email, info.password)
    if "error" in response:
        raise HTTPException(status_code=401, detail=response["error"])
    return {"data": response}

@file_auth_router.post("/get-user/")
def get_user(token: AccessToken):
    """Get user information by user ID"""
    print("Get user token:", token)
    user = file_auth.file_get_user(token.jwt)
    if user:
        return {"data": user}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.get("/logout/")
def logout():
    """Logout user (file-based auth doesn't need server-side logout)"""
    return {"data": {"message": "Logged out successfully"}}

@file_auth_router.post("/bookmark-node/")
def bookmark_node(token: AccessToken, conn: Dict):
    """Bookmark a node for the authenticated user"""
    print("Bookmark node token:", token.jwt)
    print("Bookmark node:", conn.get("conn"))
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_bookmark_node(user_id, conn.get("conn"))
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/get-bookmarked-nodes/")
def get_bookmarked_nodes(token: AccessToken):
    """Get all bookmarked nodes for the authenticated user"""
    print("Get bookmarks token:", token)
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_get_bookmarked_nodes(user_id)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/delete-bookmarked-node/")
def delete_bookmarked_node(token: AccessToken, conn: Dict):
    """Delete a bookmarked node for the authenticated user"""
    print("Delete bookmark token:", token.jwt)
    print("Delete bookmark node:", conn.get("conn"))
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_delete_bookmarked_node(user_id, conn.get("conn"))
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/update-bookmark-description/")
def update_bookmark_description(request: BookmarkUpdateRequest):
    """Update bookmark description for the authenticated user"""
    user = file_auth.file_get_user(request.token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_update_bookmark_description(user_id, request.node, request.description)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/add-preset-group/")
def add_preset_group(token: AccessToken, group: PresetGroup):
    """Add a preset group for the authenticated user"""
    print("Add preset group token:", token.jwt)
    print("Group name:", group.group_name)
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_add_preset_group(user_id, group.group_name)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/get-preset-groups/")
def get_preset_groups(token: AccessToken):
    """Get all preset groups for the authenticated user"""
    print("Get preset groups token:", token)
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_get_preset_groups(user_id)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/add-preset/")
def add_preset_to_group(token: AccessToken, preset: Preset):
    """Add a preset to a group for the authenticated user"""
    print("Add preset token:", token.jwt)
    print("Preset:", preset)
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_add_preset_to_group(user_id, preset.group_id, preset.command, preset.type, preset.button)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/get-presets/")
def get_presets(token: AccessToken, group_id: PresetGroupID):
    """Get all presets for a specific group for the authenticated user"""
    print("Get presets token:", token.jwt)
    print("Group ID:", group_id.group_id)
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_get_presets_by_group(user_id, group_id.group_id)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/delete-preset-group/")
def delete_preset_group(token: AccessToken, group_id: PresetGroupID, group: PresetGroup):
    """Delete a preset group for the authenticated user"""
    print("Delete preset group token:", token.jwt)
    print("Group ID:", group_id.group_id)
    print("Group name:", group.group_name)
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        print(f"User found: {user_id}")
        response = file_auth.file_delete_preset_group(user_id, group_id.group_id)
        print(f"Delete response: {response}")
        return {"data": response}
    else:
        print("User not found")
        raise HTTPException(status_code=404, detail="User not found")

@file_auth_router.post("/delete-preset/")
def delete_preset(token: AccessToken, preset_id: PresetID):
    """Delete an individual preset for the authenticated user"""
    print("Delete preset token:", token.jwt)
    print("Preset ID:", preset_id.preset_id)
    
    user = file_auth.file_get_user(token.jwt)
    if user:
        user_id = user["id"]
        response = file_auth.file_delete_preset(user_id, preset_id.preset_id)
        return {"data": response}
    else:
        raise HTTPException(status_code=404, detail="User not found") 