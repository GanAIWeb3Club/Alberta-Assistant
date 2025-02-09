# Alberta AI Assistant overview (Sui Agent Typhoon Hackathon)

<img src="docs/pics/alberta-bot.jpg" alt="Alt text" width="100" height="100" /> 


Alberta AI Assistant 🤖 is an innovative Telegram bot designed to enhance the cybersecurity of server nodes through AI-driven analysis and secure server management. By scanning ports, detecting vulnerabilities, and offering actionable solutions, the bot aims to provide seamless protection for IT infrastructure.

This project leverages the ```SUI blockchain``` and integrates with the ```Atoma LLM models``` to create a robust solution that generates vulnerability reports directly within Telegram. Additionally, it uses the ElizaOS framework to configure an agent with Atoma keys within the SUI plugin.

The project takes on a significant challenge—securing server nodes in real time through AI—and aims to offer a comprehensive, automated solution for vulnerability scanning, with real-time recommendations.

## 🚀 Features

1. **Port Scanning**: Scans server nodes for open ports
1. **Vulnerability Detection**: Detects known vulnerabilities on servers and provides recommendations.
1. **Telegram Integration**: Summarizes vulnerabilities and solutions in easy-to-read summaries via Telegram.
1. **SUI Wallet**: Integration with SUI wallet for secure interactions and transactions.
1. **USDC Transactions**: Facilitates USDC transfers for resolving vulnerabilities (To be implemented).
1. **Scanning Tools Used**:

- **Nmap**: A powerful tool for network discovery and vulnerability scanning, used to check open ports and identify services running on a server.
- **Nuclei**: A fast, template-based vulnerability scanner that helps identify known security flaws in the server configuration.

## 💡 Process Flow
  
```mermaid
graph TD;
    A[User opens bot (Bot has SUI wallet)] --> B[User connects SUI wallet (To be implemented)]
    B --> C[User provides server host/IP]
    C --> D[Bot checks server correctness & scan possibility]
    D --> E[Bot checks user's SUI balance (To be implemented)]
    E --> F[Bot asks to top up balance if needed (To be implemented)]
    F --> G[Bot checks Atoma balance]
    G --> H[Bot sends USDC to Atoma (If needed)]
    H --> I[Bot sends scan results to Atoma LLM (Deepseak) and retrieves action plan]
    I --> J[Bot calculates token usage and LLM costs (Mapping to user account) (To be implemented)]
    J --> K[Bot asks for user feedback and rating (To be implemented)]
    
    %% Actors
    A1[User] --> A
    A2[Bot] --> B
    A2 --> C
    A2 --> D
    A2 --> E
    A2 --> F
    A2 --> G
    A2 --> H
    A2 --> I
    A2 --> J
    A2 --> K
```

## 🛠️ Tools & Technologies

The bot currently handles scanning and vulnerability detection. Integration with ```SUI wallets``` and transaction handling (such as sending USDC) is under development.

The bot is built using the ```ElizaOS``` framework, ensuring maintainability and scalability. The implementation follows best practices for blockchain integration and Telegram bot development.

Innovation: The integration of ```Atoma LLM provider``` for generating vulnerability reports within Telegram is a unique and innovative application of AI for real-time security reporting. The use of SUI blockchain for secure wallet management and transactions adds another layer of sophistication.

### Tools options

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

#### SUI blockchain integration

![Alt text](docs/pics/sui-plugin-wallet.png)

## 🌟 Agent setup

Node 23 is required to run the agent (```nvm install 23.3.0```).

1. Clone the Repository

```bash
git clone https://github.com/yourusername/alberta-ai-assistant.git
cd alberta
```

1. Install Dependencies

```bash
pnpm clean && pnpm install && pnpm build
```

1. Start agent

```bash
pnpm start
```

## Planned Features

1. **SUI Wallet Integration**: Users will be able to connect their SUI wallet to the bot, allowing for secure transactions and interaction.
1. **Automated USDC Transactions**: The bot will automatically send USDC from its wallet to Atoma to resolve any identified vulnerabilities.
1. **Expanded Vulnerability Database**: Continuous improvement of the AI’s vulnerability detection capabilities, expanding beyond open ports.
1. **Token Usage and LLM Cost Calculation**: The bot will calculate the costs associated with using the Atoma LLM for generating reports and provide this information to users.
1. **User Feedback**: The bot will prompt users for feedback and ratings of the scan results.

---

## 🤝 Hackathon Tracks & Partner Tools

- **Track:** Atoma/ElizaOS
- **Tools:**  
  - [Eliza Framework](https://github.com/ai16z)  
  - [Atoma ](https://cloud.atoma.network/)  
  - [Telegram Bot API](https://core.telegram.org/bots)

Based on [Sui Agent Typhoon Participant Handbook ](https://notion.sui.io/sui-agent-typhoon-handbook)

---

## 📬 Contact Us

Have questions or want to collaborate?

- **Team Name:** GanAIWeb3Club
- **Email:** <skrypnychenkoandrii808@gmail.com>,<Tiunow@gmail.com>, <cryptospecura@gmail.com>, <grossbel13@gmail.com>.

---
