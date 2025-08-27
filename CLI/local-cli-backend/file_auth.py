import json
import hashlib
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import tempfile
from pathlib import Path


# # File paths for data storage
# USERS_FILE = "usr-mgm/users.json"
# BOOKMARKS_FILE = "usr-mgm/bookmarks.json"
# PRESETS_FILE = "usr-mgm/presets.json"
# PRESET_GROUPS_FILE = "usr-mgm/preset_groups.json"

# Base data directory (configurable via env; default to backend/usr-mgm next to this file)
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "usr-mgm"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

USERS_FILE = DATA_DIR / "users.json"
BOOKMARKS_FILE = DATA_DIR / "bookmarks.json"
PRESETS_FILE = DATA_DIR / "presets.json"
PRESET_GROUPS_FILE = DATA_DIR / "preset_groups.json"

_DEFAULTS: Dict[Path, Dict] = {
    USERS_FILE: {"users": []},
    BOOKMARKS_FILE: {"bookmarks": {}},
    PRESETS_FILE: {"presets": []},
    PRESET_GROUPS_FILE: {"preset_groups": []},
}

def _read_json(path: Path) -> Dict:
    try:
        if path.exists():
            with path.open("r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
    return _DEFAULTS.get(path, {})

def _write_json_atomic(path: Path, data: Dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = None
    try:
        with tempfile.NamedTemporaryFile("w", dir=str(path.parent), delete=False) as t:
            json.dump(data, t, indent=2)
            t.flush()
            os.fsync(t.fileno())
            tmp = t.name
        os.replace(tmp, path)  # atomic on POSIX
    except Exception as e:
        print(f"Error saving {path}: {e}")
        raise
    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.remove(tmp)
            except Exception:
                pass

# keep your existing functions, but switch to the helpers:
def load_json_file(filename: str) -> Dict:
    # now filename is a Path
    return _read_json(filename)

def save_json_file(filename: str, data: Dict):
    _write_json_atomic(filename, data)

# def load_json_file(filename: str) -> Dict:
#     """Load data from a JSON file"""
#     try:
#         if os.path.exists(filename):
#             with open(filename, 'r') as f:
#                 return json.load(f)
#         else:
#             # Return default structure if file doesn't exist
#             if filename == USERS_FILE:
#                 return {"users": []}
#             elif filename == BOOKMARKS_FILE:
#                 return {"bookmarks": {}}  # Changed to nested structure
#             elif filename == PRESETS_FILE:
#                 return {"presets": []}
#             elif filename == PRESET_GROUPS_FILE:
#                 return {"preset_groups": []}
#             else:
#                 return {}
#     except Exception as e:
#         print(f"Error loading {filename}: {e}")
#         return {}

# def save_json_file(filename: str, data: Dict):
#     """Save data to a JSON file"""
#     try:
#         with open(filename, 'w') as f:
#             json.dump(data, f, indent=2)
#     except Exception as e:
#         print(f"Error saving {filename}: {e}")

def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def file_signup(email: str, password: str, firstname: str, lastname: str) -> Dict:
    """Register a new user"""
    users_data = load_json_file(USERS_FILE)
    
    # Check if user already exists
    for user in users_data.get("users", []):
        if user.get("email") == email:
            return {"error": "User already exists"}
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password": hash_password(password),
        "firstname": firstname,
        "lastname": lastname,
        "created_at": datetime.now().isoformat()
    }
    
    users_data.setdefault("users", []).append(new_user)
    save_json_file(USERS_FILE, users_data)
    
    return {
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "firstname": new_user["firstname"],
            "lastname": new_user["lastname"],
            "created_at": new_user["created_at"]
        }
    }

def file_login(email: str, password: str) -> Dict:
    """Authenticate a user"""
    users_data = load_json_file(USERS_FILE)
    
    hashed_password = hash_password(password)
    
    for user in users_data.get("users", []):
        if user.get("email") == email and user.get("password") == hashed_password:
            return {
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "firstname": user["firstname"],
                    "lastname": user["lastname"],
                    "created_at": user["created_at"]
                }
            }
    
    return {"error": "Invalid email or password"}

def file_get_user(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    users_data = load_json_file(USERS_FILE)
    
    for user in users_data.get("users", []):
        if user.get("id") == user_id:
            return {
                "id": user["id"],
                "email": user["email"],
                "firstname": user["firstname"],
                "lastname": user["lastname"],
                "created_at": user["created_at"]
            }
    
    return None

def file_bookmark_node(user_id: str, node: str) -> Dict:
    """Add a bookmark for a user"""
    bookmarks_data = load_json_file(BOOKMARKS_FILE)
    
    # Initialize bookmarks structure if it doesn't exist
    if "bookmarks" not in bookmarks_data:
        bookmarks_data["bookmarks"] = {}
    
    # Initialize user's bookmarks if they don't exist
    if user_id not in bookmarks_data["bookmarks"]:
        bookmarks_data["bookmarks"][user_id] = {}
    
    # Check if bookmark already exists
    if node in bookmarks_data["bookmarks"][user_id]:
        return {"message": "Bookmark already exists"}
    
    # Add new bookmark
    bookmarks_data["bookmarks"][user_id][node] = {
        "description": "",
        "created_at": datetime.now().isoformat()
    }
    
    save_json_file(BOOKMARKS_FILE, bookmarks_data)
    
    return {"bookmark": {"user_id": user_id, "node": node, "description": "", "created_at": bookmarks_data["bookmarks"][user_id][node]["created_at"]}}

def file_get_bookmarked_nodes(user_id: str) -> List[Dict]:
    """Get all bookmarks for a user"""
    bookmarks_data = load_json_file(BOOKMARKS_FILE)
    
    user_bookmarks = []
    if "bookmarks" in bookmarks_data and user_id in bookmarks_data["bookmarks"]:
        for node, bookmark_data in bookmarks_data["bookmarks"][user_id].items():
            user_bookmarks.append({
                "user_id": user_id,
                "node": node,
                "description": bookmark_data.get("description", ""),
                "created_at": bookmark_data.get("created_at", "")
            })
    
    return user_bookmarks

def file_delete_bookmarked_node(user_id: str, node: str) -> Dict:
    """Delete a bookmark for a user"""
    bookmarks_data = load_json_file(BOOKMARKS_FILE)
    
    if "bookmarks" in bookmarks_data and user_id in bookmarks_data["bookmarks"]:
        if node in bookmarks_data["bookmarks"][user_id]:
            del bookmarks_data["bookmarks"][user_id][node]
            save_json_file(BOOKMARKS_FILE, bookmarks_data)
            return {"message": "Bookmark deleted successfully"}
    
    return {"error": "Bookmark not found"}

def file_update_bookmark_description(user_id: str, node: str, description: str) -> Dict:
    """Update bookmark description"""
    bookmarks_data = load_json_file(BOOKMARKS_FILE)
    
    if "bookmarks" in bookmarks_data and user_id in bookmarks_data["bookmarks"]:
        if node in bookmarks_data["bookmarks"][user_id]:
            bookmarks_data["bookmarks"][user_id][node]["description"] = description
            save_json_file(BOOKMARKS_FILE, bookmarks_data)
            return {"message": "Bookmark updated successfully"}
    
    return {"error": "Bookmark not found"}

def file_add_preset_group(user_id: str, group_name: str) -> Dict:
    """Add a preset group for a user"""
    groups_data = load_json_file(PRESET_GROUPS_FILE)
    
    # Check if group already exists
    for group in groups_data.get("preset_groups", []):
        if group.get("user_id") == user_id and group.get("group_name") == group_name:
            return {"error": "Group already exists"}
    
    # Add new group
    new_group = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "group_name": group_name,
        "created_at": datetime.now().isoformat()
    }
    
    groups_data.setdefault("preset_groups", []).append(new_group)
    save_json_file(PRESET_GROUPS_FILE, groups_data)
    
    return {"group": new_group}

def file_get_preset_groups(user_id: str) -> List[Dict]:
    """Get all preset groups for a user"""
    groups_data = load_json_file(PRESET_GROUPS_FILE)
    
    user_groups = []
    for group in groups_data.get("preset_groups", []):
        if group.get("user_id") == user_id:
            user_groups.append(group)
    
    return user_groups

def file_add_preset_to_group(user_id: str, group_id: str, command: str, type: str, button: str) -> Dict:
    """Add a preset to a group"""
    presets_data = load_json_file(PRESETS_FILE)
    
    # Verify group exists and belongs to user
    groups_data = load_json_file(PRESET_GROUPS_FILE)
    group_exists = False
    for group in groups_data.get("preset_groups", []):
        if group.get("id") == group_id and group.get("user_id") == user_id:
            group_exists = True
            break
    
    if not group_exists:
        return {"error": "Group not found or access denied"}
    
    # Add new preset
    new_preset = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "group_id": group_id,
        "command": command,
        "type": type,
        "button": button,
        "created_at": datetime.now().isoformat()
    }
    
    presets_data.setdefault("presets", []).append(new_preset)
    save_json_file(PRESETS_FILE, presets_data)
    
    return {"preset": new_preset}

def file_get_presets_by_group(user_id: str, group_id: str) -> List[Dict]:
    """Get all presets for a specific group"""
    presets_data = load_json_file(PRESETS_FILE)
    
    group_presets = []
    for preset in presets_data.get("presets", []):
        if preset.get("user_id") == user_id and preset.get("group_id") == group_id:
            group_presets.append(preset)
    
    return group_presets

def file_delete_preset_group(user_id: str, group_id: str) -> Dict:
    """Delete a preset group and all its presets"""
    print(f"Attempting to delete group {group_id} for user {user_id}")
    
    groups_data = load_json_file(PRESET_GROUPS_FILE)
    presets_data = load_json_file(PRESETS_FILE)

    print("User ID: ", user_id)
    print("Group ID: ", group_id)
    
    # Check if group exists and belongs to user
    group_exists = False
    for group in groups_data.get("preset_groups", []):
        if group.get("id") == group_id and group.get("user_id") == user_id:
            group_exists = True
            print(f"Found group: {group.get('group_name')} (ID: {group.get('id')})")
            break
    
    if not group_exists:
        print(f"Group {group_id} not found or doesn't belong to user {user_id}")
        return {"error": "Group not found or access denied"}
    
    # Delete the group
    original_group_count = len(groups_data.get("preset_groups", []))
    groups_data["preset_groups"] = [
        group for group in groups_data.get("preset_groups", [])
        if not (group.get("id") == group_id and group.get("user_id") == user_id)
    ]
    
    if len(groups_data["preset_groups"]) < original_group_count:
        print(f"Group deleted successfully. Groups before: {original_group_count}, after: {len(groups_data['preset_groups'])}")
        save_json_file(PRESET_GROUPS_FILE, groups_data)
        
        # Delete all presets in this group
        original_preset_count = len(presets_data.get("presets", []))
        presets_data["presets"] = [
            preset for preset in presets_data.get("presets", [])
            if not (preset.get("group_id") == group_id and preset.get("user_id") == user_id)
        ]
        
        presets_deleted = original_preset_count - len(presets_data["presets"])
        print(f"Presets deleted: {presets_deleted}. Presets before: {original_preset_count}, after: {len(presets_data['presets'])}")
        
        # Always save presets file, even if no presets were deleted
        save_json_file(PRESETS_FILE, presets_data)
        
        return {"message": f"Group and {presets_deleted} presets deleted successfully"}
    else:
        print(f"Failed to delete group. Groups before: {original_group_count}, after: {len(groups_data['preset_groups'])}")
        return {"error": "Group not found or access denied"}

def file_delete_preset(user_id: str, preset_id: str) -> Dict:
    """Delete an individual preset"""
    presets_data = load_json_file(PRESETS_FILE)
    
    # Find and delete the preset
    original_preset_count = len(presets_data.get("presets", []))
    presets_data["presets"] = [
        preset for preset in presets_data.get("presets", [])
        if not (preset.get("id") == preset_id and preset.get("user_id") == user_id)
    ]
    
    if len(presets_data["presets"]) < original_preset_count:
        save_json_file(PRESETS_FILE, presets_data)
        return {"message": "Preset deleted successfully"}
    else:
        return {"error": "Preset not found or access denied"}