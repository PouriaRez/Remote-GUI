from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import asyncio
import json
import paramiko

api_router = APIRouter(prefix="/cli", tags=["MCP Client"])

ALLOWED_METHODS = ["direct_ssh", "docker_attach", "docker_exec"]

sessions = {}

async def listen_to_ssh(ws: WebSocket, channel: paramiko.Channel):
    try:
        while True:
            if channel.recv_ready():
                output = channel.recv(4096).decode('utf-8', 'replace')
                await ws.send_text(output)
            await asyncio.sleep(0.02)
    except Exception:
        pass

def open_ssh_chan(host, user, password):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        username=user,
        port=22,
        password=password,
        timeout=10,
    )

    return client

@api_router.websocket("/ws")
async def ws_handler(ws: WebSocket):
    await ws.accept()
    
    channel = None

    try:
        while True:
            message = await ws.receive_json()
            action = message.get("action")

            if action in ALLOWED_METHODS:
                cols = message.get("cols", 80)
                rows = message.get("rows", 24)

                client = open_ssh_chan(
                    message["host"],
                    message["user"],
                    message["password"],
                )

                if action == "direct_ssh":
                    channel = client.invoke_shell(term="xterm", width=cols, height=rows)
                    await ws.send_text("Connected to SSH\r\n")
                else:
                    transport = client.get_transport()
                    channel = transport.open_session()
                    channel.get_pty(term="xterm", width=cols, height=rows)

                    if action == "docker_attach":
                        channel.exec_command("docker attach anylog-query1")
                        await ws.send_text("Attached to anylog-query1. Press <ctrl>p and then <ctrl>q to detach\r\n")

                    if action == "docker_exec":
                        channel.exec_command("docker exec -it anylog-query1 sh")
                        await ws.send_text("Started in anylog-query1\r\n")

                sessions[ws] = {
                    "client": client,
                    "channel": channel
                }
                asyncio.create_task(listen_to_ssh(ws, channel))
            elif action == "resize":
                if ws in sessions and sessions[ws].get("channel"):
                    channel = sessions[ws]["channel"]
                    cols = message.get("cols", 80)
                    rows = message.get("rows", 24)
                    channel.resize_pty(width=cols, height=rows)
            elif action == "client_input":
                if channel:
                    channel.send(message.get("input", ""))
    except WebSocketDisconnect:
        print('WS Disconnect\n')
    except Exception as e:
        await ws.send_text(f"\r\nSSH ERROR: {str(e)}\r\n")
    finally:
        session = sessions.pop(ws, None)
        if session:
            channel = session.get("channel")
            client = session.get("client")
            if channel:
                channel.close()
            if client:
                client.close()
