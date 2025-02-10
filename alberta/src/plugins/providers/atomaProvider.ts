import BigNumber from "bignumber.js";
import { AtomaPayment } from "../services/atomaPayment";

import {
    elizaLogger,
    IAgentRuntime,
    ServiceType,
    Memory,
    Provider,
    State,
} from "@elizaos/core";

// true - need to top-up the agent balance; false - all good.  
export const ATOMA_PAYMENT_CACHE_KEY = 'ATOMA_PAYMENT_STATUS';

export const atomaProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<void> => {
        const suiService = runtime.getService<AtomaPayment>(ServiceType.TRANSCRIPTION);
        suiService.trackUSDCBalances();
        const agentUSDCBalance = new BigNumber(await suiService.getAgentUSDCBalances());
        const atomaUSDCBalance = new BigNumber(await suiService.getAtomaUSDCBalances());
        const threshold = new BigNumber(2000000);
        if (atomaUSDCBalance.isLessThan(threshold) && agentUSDCBalance.isGreaterThanOrEqualTo(threshold)){
            // transfer
            runtime.cacheManager.set(ATOMA_PAYMENT_CACHE_KEY, false);
            elizaLogger.log('Transfer 2 USDC from the Agent acc to Atoma acc.');
        } else if(agentUSDCBalance.isLessThan(threshold)) {
            runtime.cacheManager.set(ATOMA_PAYMENT_CACHE_KEY, true);
            elizaLogger.log('Need to top-up the Agent balance.');
        }
    }
}

