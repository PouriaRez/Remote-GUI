1. Install requirements + AnyLog-API (I added some [requirements](../requirements.txt))

2. Start Server + Client 

```shell
screen -dmS backend bash -c 'cd ~/cli-review/UCSCAnylogGithubProjects && source venv/bin/activate && fastapi dev CLI/Local-CLI/local-cli-backend/main.py'

screen -dmS frontend bash -c 'cd ~/cli-review/UCSCAnylogGithubProjects && source venv/bin/activate && cd CLI/Local-CLI/local-cli-frontend && export NODE_OPTIONS=--openssl-legacy-provider && npm install && npm start'
```

**Output**
![behavior](../Screenshot%202025-04-19%20at%2021.52.27.png)