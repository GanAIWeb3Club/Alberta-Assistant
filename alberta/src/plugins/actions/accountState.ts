import { ServiceType } from "@elizaos/core";
import { AtomaPayment } from "../services/atomaPayment.ts";

import {
    type Action,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";


export const accountStatus: Action = {
    name: "ACCOUNT_STATUS_ACTION",
    similes: ["CHECK_ACCOUNT_ACTION", "SCAN_ACCOUNT_ACTION"],
    description: "Provide the status of the Alberta account and address",
    suppressInitialMessage: true,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, options?: {
        [key: string]: unknown;
    }, callback?: HandlerCallback) => {
        const suiService = runtime.getService<AtomaPayment>(ServiceType.TRANSCRIPTION);
        const dollarBalanceAgent = (Number(await suiService.getAgentUSDCBalances()) / 1000000).toFixed(2);
        const agentAccountReport = `*My account balance:* $${dollarBalanceAgent}.\n*Account address:* ${suiService.getAgentAccount()}\n*Network:* SUI ${suiService.getNetwork()}`;
        const response: Content = {
            inReplyTo: message.id,
            text: agentAccountReport,
            action: "ACCOUNT_STATUS_ACTION"
        };
        callback(response);
        return true;
    },
    examples: [
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Where should I send the money?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "What is the current status of the account?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Can you tell me where to transfer the funds?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Where do I need to send the payment?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Can you confirm the status of the account?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "What’s the account status and where should I send the money?",
                    "action": "ACCOUNT_STATUS_ACTION"
                }
            }
        ]
        
    ] as ActionExample[][],
} as Action;