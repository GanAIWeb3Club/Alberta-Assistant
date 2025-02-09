import diagnostics from "network-diagnostics";
import { composeContext, elizaLogger } from "@elizaos/core";
import { generateMessageResponse, generateText } from "@elizaos/core";
import { extractDomainNameTemplate, summarizeAvailabilityReportTemplate } from "./templates.ts";
import { cleanModelResponse } from "./utils.ts";
import { resolveTargetsFromTheCache } from "./utils.ts";

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

interface TestResult {
    status: boolean;
    message: string;
}

interface TargetTests {
    connection: TestResult;
    dns: TestResult;
    ping: TestResult;
    http: TestResult;
    https: TestResult;
}

interface DiagnosticReport {
    [target: string]: TargetTests;
}

export class NetworkDiagnosticScanner {
    private promisify<T>(fn: (callback: (result: T) => void) => void): Promise<T> {
        return new Promise((resolve) => {
            fn(resolve);
        });
    }

    private async runIndividualTests(target: string): Promise<TargetTests> {
        diagnostics.setTestURL(target);

        const tests = await Promise.all([
            this.promisify<boolean>(cb => diagnostics.haveConnectionAsync(cb)),
            this.promisify<boolean>(cb => diagnostics.haveDNS(cb)),
            this.promisify<boolean>(cb => diagnostics.havePing(cb)),
            this.promisify<boolean>(cb => diagnostics.haveHTTP(cb)),
            this.promisify<boolean>(cb => diagnostics.haveHTTPS(cb))
        ]);

        return {
            connection: {
                status: tests[0],
                message: tests[0] ? "Connected" : "No connection available"
            },
            dns: {
                status: tests[1],
                message: tests[1] ? "DNS resolved" : "DNS resolution failed"
            },
            ping: {
                status: tests[2],
                message: tests[2] ? "Host responds to ping" : "Host not responding to ping"
            },
            http: {
                status: tests[3],
                message: tests[3] ? "HTTP available" : "HTTP connection failed"
            },
            https: {
                status: tests[4],
                message: tests[4] ? "HTTPS available" : "HTTPS connection failed"
            }
        };
    }

    public async *scanMultipleTargets(targets: string[]): AsyncGenerator<[string, TargetTests]> {
        for (const target of targets) {
            try {
                const result = await this.runIndividualTests(target);
                yield [target, result];
            } catch (error) {
                yield [target, {
                    connection: { status: false, message: `Error: ${error.message}` },
                    dns: { status: false, message: `Error: ${error.message}` },
                    ping: { status: false, message: `Error: ${error.message}` },
                    http: { status: false, message: `Error: ${error.message}` },
                    https: { status: false, message: `Error: ${error.message}` }
                }];
            }
        }
    }
}

export const validateNodeConnection: Action = {
    name: "VALIDATE_HOST_CONNECTIVITY_ACTION",
    similes: ["VALIDATE_DOMAIN_CONNECTIVITY_ACTION", "CHECK_HOST_CONNECTIVITY_ACTION", "CHECK_DOMAIN_CONNECTIVITY_ACTION"],
    description: "Validate the connection to a host or domain",
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
        elizaLogger.debug(`NAMES CONTEXT: ${namesContext}`);
        const namesResponse = await generateMessageResponse({
            runtime,
            context: namesContext,
            modelClass: ModelClass.LARGE,
        }); 

        let targets = (namesResponse.targets || []) as string[];
        targets = await resolveTargetsFromTheCache(runtime, message, targets);

        const scanner = new NetworkDiagnosticScanner();
        for await (const [target, testResult] of scanner.scanMultipleTargets(targets)){
            state.targetHost = target;
            state.availabilityResult = JSON.stringify(testResult);
            const availabilityContext = composeContext({
                state: state,
                template: summarizeAvailabilityReportTemplate,
            });
            elizaLogger.debug(`AVAILABILITY CONTEXT: ${availabilityContext}`);
            const availabilityResponse = await generateText({
                runtime,
                context: availabilityContext,
                modelClass: ModelClass.LARGE,
            });
            const cleanAvailabilityResponse = cleanModelResponse(availabilityResponse);
            elizaLogger.debug(`AVAILABILITY REPORT: ${cleanAvailabilityResponse}`);
            const response: Content = {
                inReplyTo: message.id,
                text: cleanAvailabilityResponse,
                action: "VALIDATE_HOST_CONNECTIVITY_ACTION"
            };
            callback(response);
        }
        const availabilityResult =  await scanner.scanMultipleTargets(targets);

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I'm having trouble accessing the server at 192.168.1.1.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you look into api.example.com?",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The website at www.mywebsite.com is down.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The database server at 10.0.0.5 seems slow.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you ping google.com and see if it's reachable?",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if 8.8.8.8 is responding.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The DNS for subdomain.test.com isn't resolving.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The IP 172.16.254.1 seems unreachable.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I need to SSH into server-01.example.org.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you check the status of 192.168.0.100?",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The API endpoint at api.services.com is timing out.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The internal server at 10.10.10.10 is down.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you verify the SSL certificate for secure.example.net?",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The IP 203.0.113.1 seems to be blocked.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The load balancer at lb.example.com is overloaded.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The database at 192.168.2.1 is slow.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The website at www.oldwebsite.com is redirecting incorrectly.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The server at 10.1.1.1 is unreachable.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The DNS for test.example.org isn't resolving.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "The IP 192.168.10.10 seems to be down.",
                    action: "VALIDATE_HOST_CONNECTIVITY_ACTION",
                },
            },
        ]
    ] as ActionExample[][],
} as Action;