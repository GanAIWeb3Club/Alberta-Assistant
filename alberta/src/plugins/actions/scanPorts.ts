import net from "net";
import nodeNmap from "node-nmap";
import { composeContext, elizaLogger, generateObject } from "@elizaos/core";
import { generateMessageResponse, generateTrueOrFalse } from "@elizaos/core";
import { extractDomainNameTemplate } from "./templates.ts";

const { NmapScan } = nodeNmap;

import {
    type Action,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
} from "@elizaos/core";

interface ScanResult {
  ports: string[];
  error: string;
}

interface ScanResults {
  [key: string]: ScanResult;
}

interface ScanResponse {
  targets: string[];
}

// Validate if string is a valid domain name
function isValidTarget(target: string): boolean {
  const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(target);
  const isIP = net.isIP(target) !== 0;
  return isDomain || isIP;
}

// Function to scan a single target and return a Promise
function scanTarget(target: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    if (!isValidTarget(target)) {
      resolve({
        ports: [],
        error: `Invalid target format: ${target}`
      });
      return;
    }

    const sanitizedTarget = target.replace(/[;&|`$()]/g, '');
    
    try {
      const scan = new NmapScan(sanitizedTarget, '-p- -n --open');

      const timeoutId = setTimeout(() => {
        scan.cancelScan();
        resolve({
          ports: [],
          error: 'Scan timeout after 5 minutes'
        });
      }, 60000); // 1 minute timeout

      scan.on('complete', (data) => {
        clearTimeout(timeoutId);
        if (!data || !data[0] || !data[0].openPorts) {
          resolve({
            ports: [],
            error: ''  // No error, just no open ports found
          });
          return;
        }
        const ports = data[0].openPorts.map(port => port.port.toString());
        resolve({
          ports,
          error: ''
        });
      });

      scan.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          ports: [],
          error: `Scan error: ${error.message || error}`
        });
      });

      scan.startScan();
    } catch (error) {
      resolve({
        ports: [],
        error: `Scan initialization failed: ${error.message || error}`
      });
    }
  });
}

// Main function to scan all targets
async function scanAllTargets(targets: string[]): Promise<ScanResults> {
  let response: ScanResponse;
  const results: ScanResults = {};

  // Validate targets array is not empty
  if (targets.length === 0) {
    throw new Error('Empty targets array');
  }

  // Maximum number of concurrent scans
  const MAX_CONCURRENT_SCANS = 5;
  
  // Process targets in batches
  for (let i = 0; i < targets.length; i += MAX_CONCURRENT_SCANS) {
    const batch = targets.slice(i, i + MAX_CONCURRENT_SCANS);
    const scanPromises = batch.map(async (target) => {
      try {
        const result = await scanTarget(target);
        results[target] = result;
      } catch (error) {
        results[target] = {
          ports: [],
          error: `Unexpected error: ${error.message || error}`
        };
      }
    });

    await Promise.all(scanPromises);
  }

  return results;
}


export const scanPorts: Action = {
    name: "SCAN_PORTS_ACTION",
    similes: ["CHECK_PORTS_ACTION", "SCAN_PORT_ACTION"],
    description: "Scan the ports of a host or domain",
    suppressInitialMessage: true,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        state.lastMessage = message.content.text;
        const namesContext = composeContext({
            state: state,
            template: extractDomainNameTemplate,
        });
        elizaLogger.debug(`CONTEXT: ${namesContext}`);
        const response = await generateMessageResponse({
            runtime,
            context: namesContext,
            modelClass: ModelClass.LARGE,
        }); 

        // Add type assertion or validation
        const targets = (response.targets || []) as string[];
        const results = await scanAllTargets(targets);

        console.log(`action handler scanPorts: Scanning ports. ${JSON.stringify(results)}`);
        return "We're scanning the port";
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you scan the ports for 192.168.1.1?",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for api.example.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on www.mywebsite.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 10.0.0.5.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for google.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 8.8.8.8.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for subdomain.test.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 172.16.254.1.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on server-01.example.org.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for 192.168.0.100.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on api.services.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 10.10.10.10.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for secure.example.net.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 203.0.113.1.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on lb.example.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for 192.168.2.1.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on www.oldwebsite.com.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 10.1.1.1.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for test.example.org.",
                    action: "SCAN_PORTS",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 192.168.10.10.",
                    action: "SCAN_PORTS",
                },
            },
        ]
    ] as ActionExample[][],
} as Action;