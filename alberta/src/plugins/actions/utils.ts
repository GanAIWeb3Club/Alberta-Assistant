import { Content, HandlerCallback, IAgentRuntime, Memory, elizaLogger } from "@elizaos/core";
import { ATOMA_PAYMENT_CACHE_KEY } from "../providers/atomaProvider.ts";

/**
 * Removes think block tags and their content from a response string
 * @param response - The string containing potential think block tags
 * @returns The cleaned string with think blocks removed
 */
export const cleanModelResponse = (response: string) => {
    // Remove think block if present
    const thinkBlockRegex = /<think>[\s\S]*?<\/think>/;
    return response.replace(thinkBlockRegex, '').trim();
}

/**
 * Suffix used for caching host information
 */
export const HOST_CACHE_SUFFIX = 'hosts'

/**
 * Resolves target hosts either from cache or saves new targets to cache
 * @param runtime - The agent runtime instance
 * @param message - The memory object containing agent and user IDs
 * @param targets - Array of target hosts to resolve or cache
 * @returns Promise resolving to array of target hosts
 */
export const resolveTargetsFromTheCache = async (runtime: IAgentRuntime, message: Memory, targets: string[]): Promise<string[]> => {
    if(!targets.length){
        const cachedTargets = (await runtime.cacheManager.get(`${message.agentId}-${message.userId}-${HOST_CACHE_SUFFIX}}`)) as string[];
        elizaLogger.debug(`GET TARGETS FROM CACHE: ${cachedTargets}`);
        return cachedTargets;
    } else {
        await runtime.cacheManager.set(`${message.agentId}-${message.userId}-${HOST_CACHE_SUFFIX}}`, targets);
        elizaLogger.debug(`PUT TARGETS TO THE CACHE`);
        return targets;
    }
};

/**
 * Checks the current Atoma balance status
 * @param runtime - The agent runtime instance
 * @returns Promise resolving to boolean indicating if balance is sufficient
 */
export const topUpAtomaBalanceStatus = async (runtime: IAgentRuntime): Promise<boolean> => {
    const requestPaymentStatus = await runtime.cacheManager.get(ATOMA_PAYMENT_CACHE_KEY) as boolean || false;
    elizaLogger.debug(`Do we need to top up the agent balance: ${requestPaymentStatus}`);
    return !requestPaymentStatus;
}

/**
 * Notifies user about required Atoma USDC balance payments
 * @param message - The memory object for the current interaction
 * @param callback - Optional callback function to handle the response
 * @returns Promise resolving when notification is sent
 */
export const notifyUserAboutAtomaPayments = async (message: Memory, callback?: HandlerCallback): Promise<void> => {
    const response: Content = {
        inReplyTo: message.id,
        text: "Low balance. Please add at least $2 to Alberta's USDC balance.",
    };
    elizaLogger.debug("Low balance. Please add at least $2 to Alberta's USDC balance.");
    callback(response);
    return;
}