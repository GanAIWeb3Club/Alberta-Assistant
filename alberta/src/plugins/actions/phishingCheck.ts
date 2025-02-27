import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { composeContext, elizaLogger } from "@elizaos/core";
import { generateMessageResponse, generateText } from "@elizaos/core";
import { extractDomainNameTemplate, summarizePhishingReportTemplate } from "./templates.ts";
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


// Define the types
type CheckResult = {
    [key: string]: boolean | { url: boolean, domain: boolean };
  };
  
  // Main function to check domains, URLs and IPs
export async function checkPhishing(
items: string[],
phishingDir: string
): Promise<CheckResult> {
const domainsPath = path.join(phishingDir, 'ALL-phishing-domains.lst');
const linksPath = path.join(phishingDir, 'ALL-phishing-links.lst');

const result: CheckResult = {};

// Initialize all results to false
for (const item of items) {
    result[item] = false;
}

// Group items by type to minimize file reads
const domains: string[] = [];
const urls: string[] = [];
const ips: string[] = [];
const urlDomains: Map<string, string> = new Map(); // Maps extracted domains to original URLs

for (const item of items) {
    const itemType = determineItemType(item);
    
    switch (itemType) {
    case 'domain':
        domains.push(item.toLowerCase());
        break;
    case 'url':
        urls.push(normalizeUrl(item));
        const domain = extractDomainFromUrl(item);
        if (domain) {
        urlDomains.set(domain.toLowerCase(), item);
        }
        break;
    case 'ip':
        ips.push(item);
        break;
    }
}

// Check domains and IPs against ALL-phishing-domains.lst
if (domains.length > 0 || ips.length > 0) {
    await checkItemsAgainstFile([...domains, ...ips], domainsPath, (item, found) => {
    result[item] = found;
    });
}

// Check URLs against ALL-phishing-links.lst
if (urls.length > 0) {
    await checkItemsAgainstFile(urls, linksPath, (item, found) => {
    result[item] = found;
    });
}

// Check extracted domains from URLs against ALL-phishing-domains.lst
if (urlDomains.size > 0) {
    const extractedDomains = Array.from(urlDomains.keys());
    await checkItemsAgainstFile(extractedDomains, domainsPath, (domain, found) => {
    if (found) {
        // Get original URL(s) that this domain came from
        for (const [d, url] of urlDomains.entries()) {
        if (d === domain) {
            result[`DOMAIN ${url}`] = true;
        }
        }
    }
    });
}

return result;
}

// Helper function to check a list of items against a file
async function checkItemsAgainstFile(
items: string[],
filePath: string, 
callback: (item: string, found: boolean) => void
): Promise<void> {
// Convert items to lowercase and create a Set for efficient lookup
const itemsSet = new Set(items.map(item => item.toLowerCase()));

const fileStream = fs.createReadStream(filePath);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

for await (const line of rl) {
    // Skip empty lines and comments
    if (!line.trim() || line.startsWith('#')) continue;
    
    const normalizedLine = line.toLowerCase().trim();
    
    // Check if any of our items match this line
    if (itemsSet.has(normalizedLine)) {
    callback(normalizedLine, true);
    
    // Remove the item from our set once found
    itemsSet.delete(normalizedLine);
    
    // If we've found all items, we can stop reading the file
    if (itemsSet.size === 0) break;
    }
}
}

// Helper function to determine if an item is a domain, URL, or IP
function determineItemType(item: string): 'domain' | 'url' | 'ip' | 'unknown' {
// Check if it's a URL (has a protocol)
if (item.match(/^(https?|ftp):\/\//i)) {
    return 'url';
}

// Check if it's an IP address (IPv4)
if (item.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
    return 'ip';
}

// Check if it's an IPv6 address
if (item.includes(':') && !item.includes('/')) {
    try {
    // Check if it's a valid IPv6
    if (item.match(/^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i)) {
        return 'ip';
    }
    } catch (e) {
    // Not a valid IPv6
    }
}

// Check if it's likely a domain (has at least one dot and no spaces)
if (item.includes('.') && !item.includes(' ') && !item.includes('/')) {
    return 'domain';
}

return 'unknown';
}

// Helper function to extract domain from URL
function extractDomainFromUrl(urlString: string): string | null {
try {
    const parsedUrl = new URL(urlString);
    return parsedUrl.hostname;
} catch (e) {
    return null;
}
}

// Helper function to normalize URLs for comparison
function normalizeUrl(urlString: string): string {
// Remove trailing slashes, convert to lowercase
return urlString.toLowerCase().replace(/\/+$/, '');
}



export const phishingCheckAction: Action = {
    name: "CHECK_PHISHING_URL_ACTION",
    similes: ["CHECK_PHISHING_DOMAIN_ACTION", "CHECK_PHISHING_IP_ACTION", 
        "CHECK_PHISHING_DOMAINS_ACTION", "CHECK_PHISHING_URLS_ACTION"],
    description: "Check if the URL, domain is scam",
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
        elizaLogger.log(`NAMES CONTEXT: ${namesContext}`);
        const namesResponse = await generateMessageResponse({
            runtime,
            context: namesContext,
            modelClass: ModelClass.LARGE,
        }); 

        let targets = (namesResponse.targets || []) as string[];
        targets = await resolveTargetsFromTheCache(runtime, message, targets);

        const phishing_lst_dir = runtime.getSetting("PHISHING_DIR")
        const results = await checkPhishing(targets, phishing_lst_dir);

        state.phishingCheckResult = JSON.stringify(results);
        const phishingCheckContext = composeContext({
            state: state,
            template: summarizePhishingReportTemplate,
        });
        elizaLogger.debug(`PHISHING CHECK CONTEXT: ${phishingCheckContext}`);
        const phishingCheckResponse = await generateText({
            runtime,
            context: phishingCheckContext,
            modelClass: ModelClass.LARGE,
        });
        const cleanPhishingCheckResponse = cleanModelResponse(phishingCheckResponse);
        elizaLogger.debug(`PHISHING CHECK REPORT: ${cleanPhishingCheckResponse}`);
        const response: Content = {
            inReplyTo: message.id,
            text: cleanPhishingCheckResponse,
            action: "CHECK_PHISHING_URL_ACTION"
        };
        callback(response);
        
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you check if 192.168.1.1 is a phishing site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if api.example.com is a phishing attempt.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is www.mywebsite.com a phishing site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on 10.0.0.5.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if google.com is a phishing URL.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is 8.8.8.8 a phishing attempt?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if subdomain.test.com is a phishing site.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on 172.16.254.1.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is server-01.example.org a phishing URL?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if 192.168.0.100 is a phishing attempt.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on api.services.com.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is 10.10.10.10 a phishing site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if secure.example.net is a phishing URL.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on 203.0.113.1.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is lb.example.com a phishing attempt?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if 192.168.2.1 is a phishing site.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on www.oldwebsite.com.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is 10.1.1.1 a phishing URL?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check if test.example.org is a phishing attempt.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Run a phishing check on 192.168.10.10.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
    
        // New variations based on provided phrases
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org safe to open?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "May I open test.example.org?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Could you check test.example.org?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "May I use test.example.org?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please check test.example.org.",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is it a phishing site, test.example.org?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a phishing URL?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you verify if test.example.org is safe?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org dangerous?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Could you check if test.example.org is malicious?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org trustworthy?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you confirm if test.example.org is safe?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a scam?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a fake site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Could you check if test.example.org is a phishing site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a malicious site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a dangerous site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you check if test.example.org is a scam site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check it",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],

        [
            {
                user: "{{user1}}",
                content: {
                    text: "test.example.org",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ],
        
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is test.example.org a fraudulent site?",
                    action: "CHECK_PHISHING_URL_ACTION",
                },
            },
        ]
    ] as ActionExample[][],
} as Action;