import os
import sys
from .security.security_router import security_router

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
sys.path.append(BASE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict

from parsers import parse_response
from classes import *
from sql_router import sql_router
from file_auth_router import file_auth_router


# from helpers import make_request, grab_network_nodes, monitor_network, make_policy, send_json_data
from helpers import make_request, grab_network_nodes, monitor_network, make_policy, send_json_data, make_preset_policy
import helpers


app = FastAPI()

FRONTEND_URL = os.getenv('FRONTEND_URL', '*')
# Allow CORS (React frontend -> FastAPI backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "*"],  # Change this to your React app's URL for security
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Allows all headers
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Include routers


app.include_router(sql_router)
app.include_router(file_auth_router)
app.include_router(security_router)
# 23.239.12.151:32349
# run client () sql edgex extend=(+node_name, @ip, @port, @dbms_name, @table_name) and format = json and timezone=Europe/Dublin  select  timestamp, file, class, bbox, status  from factory_imgs where timestamp >= now() - 1 hour and timestamp <= NOW() order by timestamp desc --> selection (columns: ip using ip and port using port and dbms using dbms_name and table using table_name and file using file) -->  description (columns: bbox as shape.rect)


@app.get("/")
def list_static_files():
    try:
        files = []
        for root, dirs, filenames in os.walk(STATIC_DIR):
            for filename in filenames:
                rel_dir = os.path.relpath(root, STATIC_DIR)
                rel_file = os.path.join(rel_dir, filename) if rel_dir != '.' else filename
                files.append(rel_file)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/")
def get_status():
    # print("GET STATUS RUNNING")
    resp = make_request("23.239.12.151:32349", "GET", "blockchain get *")
    return {"status": resp}
    # user = supabase_get_user()
    # return {"data": user}

# File-based authentication endpoints are now handled by file_auth_router



# NODE API ENDPOINTS

@app.post("/send-command/")
def send_command(conn: Connection, command: Command):
    raw_response = make_request(conn.conn, command.type, command.cmd.strip())
    print("raw_response", raw_response)

    structured_data = parse_response(raw_response)
    print("structured_data", structured_data)
    return structured_data


@app.post("/get-network-nodes/")
def get_connected_nodes(conn: Connection):
    connected_nodes = grab_network_nodes(conn.conn)
    return {"data": connected_nodes}

@app.post("/monitor/")
def monitor(conn: Connection):
    monitored_nodes = monitor_network(conn.conn)
    return {"data": monitored_nodes}

@app.post("/submit-policy/")
def submit_policy(conn: Connection, policy: Policy):
    print("conn", conn)
    print("policy", policy)
    raw_response = make_policy(conn.conn, policy)

    structured_data = parse_response(raw_response)
    return structured_data


@app.post("/add-data/")
def send_data(conn: Connection, dbconn: DBConnection, data: list[Dict]):
    print("conn", conn.conn)
    print("db", dbconn.dbms)
    print("table", dbconn.table)
    print("data", type(data))

    raw_response = send_json_data(conn=conn.conn, dbms=dbconn.dbms, table=dbconn.table, data=data)

    structured_data = parse_response(raw_response)
    return structured_data


# Bookmark and preset endpoints are now handled by file_auth_router


# All bookmark and preset endpoints are now handled by file_auth_router


# Preset group endpoints are now handled by file_auth_router


# All preset endpoints are now handled by file_auth_router

@app.post("/get-preset-policy/")
def get_preset_policy():
    """
    Get all presets for a specific group for the authenticated user.
    """

    resp = helpers.get_preset_base_policy("23.239.12.151:32349")
    parsed = parse_response(resp)
    lb = parsed['data']['bookmark']['bookmarks']
    print("list of bookmarks:", lb)
    filtered_lb = {key: value for key, value in lb.items() if isinstance(value, dict)}
    
    return {"data": filtered_lb}





@app.post("/view-blobs/")
def view_blobs(conn: Connection, blobs: dict):
    print("conn", conn.conn)
    # print("blobs", blobs['blobs'])

    file_list = []
    for blob in blobs['blobs']:
        print("blob", blob)
        # Here you would implement the logic to view the blob

        ip_port = f"{blob['ip']}:{blob['port']}"
        operator_dbms = blob['dbms_name']
        operator_table = blob['table_name']
        operator_file = blob['file']
        file_list.append(operator_file)

        # blobs_dir = "/app/Remote-CLI/djangoProject/static/blobs/current/"
        blobs_dir = "/app/CLI/local-cli-backend/static/"
        # if not os.path.exists(blobs_dir): 
        #     print("Blobs directory does not exist")
        #     root = __file__.split("CLI")[0] 
        #     blobs_dir = blobs_dir.replace('/app', root) 
        print("IP:Port", ip_port)

        print("blobs_dir", blobs_dir)


        # cmd = f'run client ({ip_port}) file get !!blockchain_file !blockchain_file'
        # cmd = f'run client ({ip_port}) file get !!blobs_dir/{operator_file} !blobs_dir/{operator_file}'

        cmd = f"run client ({ip_port}) file get (dbms = blobs_{operator_dbms} and table = {operator_table} and id = {operator_file}) {blobs_dir}{operator_dbms}.{operator_table}.{operator_file}"  # Add file full path and name for the destination on THIS MACHINE
        raw_response = make_request(conn.conn, "POST", cmd)

        try:
            files_in_dir = os.listdir(blobs_dir)
            print("Files in blobs_dir:", files_in_dir)
        except Exception as e:
            print(f"Error listing files in {blobs_dir}: {e}")
            files_in_dir = []

        print("raw_response", raw_response)


    return {"data": file_list}



# streaming
# info = (dest_type = rest) 
# for streaming — views.py method stream_process
# uses post
# cmd: source_url = f"http://{ip}:{port}/?User-Agent=AnyLog/1.23?command=file retrieve where dbms={dbms} and table={table} and id={file} and stream = true"

# build image or video or audio (aka any file) viewer




# http://45.33.110.211:31800