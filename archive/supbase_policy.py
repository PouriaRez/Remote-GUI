import json

from anylog_api.anylog_connector import AnyLogConnector

def create_policy(conn:AnyLogConnector, policy_name:str, company_name:str, database_url:str, supabase_url:str, supabase_key:str):
    """
    Create a policy containing supbase credentials to be reused
    :args:
        conn:AnyLogConnector - connection to AnyLog
        policy_name:str - policy name
        company_name:str - policy owner
        database_url:str - DATABASE_URL
        supabase_url:str - SUPABASE_URL
        supabase_key:str - SUPABASE_KEY
    :params:
        new_policy:dict - generated policy
        serialized_policy:str - new_policy serialized for publishing
    """
    new_policy = {
        "supbase-info": {
            "name": policy_name,
            "company": company_name,
            "database_url": database_url,
            "supabase_url": supabase_url,
            "supabase_key": supabase_key
        }
    }

    serialized_policy = f"<new_policy={json.dumps(new_policy)}"
    conn.post(command="insert where policy=!new_policy and local=true and master=!ledger_conn", payload=serialized_policy)

def get_policy(conn:AnyLogConnector, policy_name:str=None, company_name:str=None)->(list or None):
    """
    based on user input get last policy
    :args:
        conn:AnyLogConnector - connection to AnyLog
        policy_name:str - policy name
        company_name:str - policy owner
    :params:
        command:str - blockchain command
        policy:list - policy from blockchain
    :return:
        policy or None
    """
    command = "blockchain get supbase-info where"
    if not policy_name and not company_name:
        command = command.replace("where", "bring.last")
    if policy_name:
        command += f' name="{policy_name}" and'
    if company_name:
        command += f' company="{company_name}" and'
    command = command.replace("and", "bring.last", -1) # replace last iteration of `and`

    policy = conn.get(command=command, destination=None)

    return policy
