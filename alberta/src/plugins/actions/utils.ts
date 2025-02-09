import { IAgentRuntime, Memory, elizaLogger } from "@elizaos/core";

export const cleanModelResponse = (response: string) => {
    // Remove think block if present
    const thinkBlockRegex = /<think>[\s\S]*?<\/think>/;
    return response.replace(thinkBlockRegex, '').trim();
}


export const HOST_CACHE_SUFFIX = 'hosts'

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