# User Management Files

This folder contains all user management related data files for the AnyLog CLI application.

## Files

- **users.json** - User account information (email, password hash, profile data)
- **bookmarks.json** - User bookmarks and saved nodes
- **presets.json** - User query presets and commands
- **preset_groups.json** - Groups/categories for organizing presets

## File Structure

### users.json
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "password": "hashed_password",
      "firstname": "John",
      "lastname": "Doe",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### bookmarks.json
```json
{
  "bookmarks": {
    "user_id": [
      {
        "id": "uuid",
        "name": "Bookmark Name",
        "node_info": {...}
      }
    ]
  }
}
```

### presets.json
```json
{
  "presets": [
    {
      "id": "uuid",
      "group_id": "group_uuid",
      "command": "SELECT * FROM table",
      "type": "GET",
      "button": "Button Label"
    }
  ]
}
```

### preset_groups.json
```json
{
  "preset_groups": [
    {
      "id": "uuid",
      "user_id": "user_uuid",
      "group_name": "Group Name"
    }
  ]
}
```

## Notes

- All files use JSON format for easy reading and debugging
- User passwords are stored as SHA-256 hashes
- Files are automatically created with default structure if they don't exist
- All operations are handled through the `file_auth.py` module
