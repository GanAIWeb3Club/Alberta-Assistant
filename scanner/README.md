# Tools options

- **Nmap**: a powerful tool for network discovery and vulnerability scanning, used to check open ports and identify services running on a server.
- **nuclei**: a fast tool for configurable targeted scanning based on templates offering massive extensibility and ease of use: <https://github.com/projectdiscovery/nuclei>

#### Nuclei installation

```bash
#MacOs  installation
brew install nuclei
nuclei -h
# Console output
sudo nuclei -target 158.220.105.69
# Streaming output in console and JSON
sudo nuclei -target 158.220.105.69 -stream -j -o ./scanner/nuclei_results/stream.json

# JSON output
sudo nuclei -target 158.220.105.69 -silent -j -o ./scanner/nuclei_results/test.json
# Fuzzing
sudo nuclei -target 158.220.105.69 -dast -j -o ./scanner/nuclei_results/dast.json 

```

Console output
![Alt text](docs/pics/nuclei_console_ouptu.png)

#### Nuclei usage

```bash
sudo node scanner/nuclei.js
```

#### Nmap installation

```bash
# MacOS
brew update
brew install nmap

# Ubuntu
sudo apt update
sudo apt install nmap

npm init -y
npm install node-nmap
```

#### Nmap usage

```bash
sudo node scanner/nmap.js
```

Example output

```json
[
  {
    "hostname": "vmi1972177.contaboserver.net",
    "ip": "37.60.245.70",
    "mac": null,
    "openPorts": [
      {
        "port": 22,
        "protocol": "tcp",
        "service": "ssh",
        "method": "probed"
      },
      {
        "port": 80,
        "protocol": "tcp",
        "service": "http",
        "method": "probed"
      },
      {
        "port": 9000,
        "protocol": "tcp",
        "service": "http",
        "method": "probed"
      },
      {
        "port": 27017,
        "protocol": "tcp",
        "service": "mongodb",
        "method": "probed"
      },
      {
        "port": 31333,
        "protocol": "tcp",
        "service": "http",
        "method": "probed"
      }
    ],
    "osNmap": "Linux 5.0 - 5.14"
  }
]
```

### Atoma integration

#### Installation

```bash

npm install dotenv
npm add https://github.com/atoma-network/atoma-sdk-typescript.git
```

### Run

```bash
node atoma_llm/atoma.js
```

### API reference

API docs: <https://docs.atoma.network/cloud-api-reference/chat/create-chat-completion>

#### Insufficient funds

```json
HTTP/1.1 402 Payment Required
....
{
  "error": {
    "code": "BALANCE_ERROR",
    "message": "Insufficient balance"
  }
}
```
