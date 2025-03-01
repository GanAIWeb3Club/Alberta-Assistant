import { composeContext, elizaLogger, generateText } from "@elizaos/core";
import { generateMessageResponse } from "@elizaos/core";
import { exec } from "child_process";
import { promisify } from "util";
import { extractDomainNameTemplate, summarizePortsScanReportTemplate } from "./templates.ts";
import { cleanModelResponse, resolveTargetsFromTheCache } from "./utils.ts";

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


const execAsync = promisify(exec);

/**
 * Interface representing the result of an Nmap port scan
 */
interface NmapResult {
    target: string;      // The scanned target (IP or domain)
    output: string;      // Raw output from the nmap command
    error?: string;      // Error message if scan failed
    timestamp: Date;     // When the scan was performed
    duration: number;    // Scan duration in milliseconds
}

/**
 * Class responsible for performing network port scans using Nmap
 */
export class NetworkScanner {
    private readonly defaultTimeout = 300000; // 5 minutes
    private readonly nmapCommand = 'timeout 180s nmap {target} -p 1-65535 -sV -O 2>&1 | grep -v -E "SF|WARNING"'; // Rollback when context will be wider

    /**
     * Sanitizes and validates a target input to prevent command injection
     * @param target - The target IP address or domain name to sanitize
     * @returns The sanitized target string
     * @throws Error if target format is invalid
     */
    private sanitizeTarget(target: string): string {
        // Remove any shell special characters and whitespace
        const sanitized = target
            .replace(/[;&|`$()]/g, '')
            .replace(/\s+/g, '')
            .trim();

        // Validate IP or domain format
        const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(sanitized);
        const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/.test(sanitized);

        if (!isValidIP && !isValidDomain) {
            throw new Error(`Invalid target format: ${target}`);
        }

        return sanitized;
    }

    /**
     * Executes an Nmap scan against a single target
     * @param target - The target IP address or domain to scan
     * @param timeout - Optional timeout in milliseconds (defaults to 5 minutes)
     * @returns Promise resolving to the scan results
     */
    private async runNmapScan(target: string, timeout: number = this.defaultTimeout): Promise<NmapResult> {
        const startTime = Date.now();
        
        try {
            const sanitizedTarget = this.sanitizeTarget(target);
            const command = this.nmapCommand.replace('{target}', sanitizedTarget);

            const { stdout, stderr } = await execAsync(command, { 
                timeout,
                killSignal: 'SIGTERM'
            });

            return {
                target: sanitizedTarget,
                output: stdout,
                error: stderr || undefined,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };

        } catch (error) {
            const isTimeout = error.code === 'ETIMEDOUT';
            
            return {
                target,
                output: '',
                error: isTimeout ? 
                    `Scan timed out after ${timeout/1000} seconds` : 
                    error.message,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Scans multiple targets sequentially, yielding results as they complete
     * @param targets - Array of target IPs or domains to scan
     * @param timeout - Optional timeout for each individual scan
     * @yields NmapResult for each completed scan
     */
    public async *scanTargets(
        targets: string[], 
        timeout?: number
    ): AsyncGenerator<NmapResult> {
        for (const target of targets) {
            try {
                const result = await this.runNmapScan(target, timeout);
                yield result;
            } catch (error) {
                yield {
                    target,
                    output: '',
                    error: `Failed to scan target: ${error.message}`,
                    timestamp: new Date(),
                    duration: 0
                };
            }
        }
    }
}

/**
 * Action definition for port scanning functionality
 * Allows users to scan ports on specified hosts or domains using Nmap
 * Includes input validation, target resolution, and formatted result reporting
 */
export const scanPorts: Action = {
    name: "SCAN_PORTS_ACTION",
    similes: ["CHECK_PORTS_ACTION", "SCAN_PORT_ACTION"],
    description: "Scan the ports of a host or domain",
    suppressInitialMessage: true,
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, options?: {
        [key: string]: unknown;
    }, callback?: HandlerCallback) => {
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

        let targets = (response.targets || []) as string[];
        targets = await resolveTargetsFromTheCache(runtime, message, targets);

        const scanner = new NetworkScanner();
        for await (const scanResult of  scanner.scanTargets(targets)) {
            state.scanResult = JSON.stringify(scanResult);
            const scanPortsContext = composeContext({
                state: state,
                template: summarizePortsScanReportTemplate,
            });
            elizaLogger.debug(`SCAN PORTS CONTEXT: ${scanPortsContext}`);
            const scanPortsReportResponse = await generateText({
                runtime,
                context: scanPortsContext,
                modelClass: ModelClass.LARGE,
            });
            const cleanScanPortsReportResponse = cleanModelResponse(scanPortsReportResponse);
            elizaLogger.debug(`SCAN PORTS REPORT: ${cleanScanPortsReportResponse}`);
            const response: Content = {
                inReplyTo: message.id,
                text: cleanScanPortsReportResponse,
                action: "SCAN_PORTS_ACTION"
            };
            callback(response);
        }
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you scan the ports for 192.168.1.1?",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for api.example.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on www.mywebsite.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 10.0.0.5.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for google.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 8.8.8.8.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for subdomain.test.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 172.16.254.1.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on server-01.example.org.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for 192.168.0.100.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on api.services.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 10.10.10.10.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for secure.example.net.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 203.0.113.1.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check which ports are open on lb.example.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for 192.168.2.1.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on www.oldwebsite.com.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check the open ports on 10.1.1.1.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Scan the ports for test.example.org.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a port scan on 192.168.10.10.",
                    action: "SCAN_PORTS_ACTION",
                },
            },
        ]
    ] as ActionExample[][],
} as Action;