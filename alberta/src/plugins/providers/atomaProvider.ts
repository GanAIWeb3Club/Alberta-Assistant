import BigNumber from "bignumber.js";
import { Transaction } from "@mysten/sui/transactions";
import { AtomaPayment } from "../services/atomaPayment";
import { getTransactionLink, parseAccount } from "../suiUtils.ts";

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
            const suiAccount = parseAccount(runtime);
            const suiClient = suiService.getSuiClient();
            const agentCoins = await suiClient.getCoins({
                owner: suiService.getAgentAccount(),
                coinType: suiService.getCoinType()
            });

            const tx = new Transaction();
            const [coin] = tx.splitCoins(agentCoins.data[0].coinObjectId, ['2000000']); // Transfer 2$ USDC
            tx.transferObjects([coin], suiService.getAtomaAccount());   
            const executedTransaction =
                await suiClient.signAndExecuteTransaction({
                    signer: suiAccount,
                    transaction: tx,
                });
            
            const transactionLink = getTransactionLink(suiService.getNetwork(), executedTransaction.digest);
            elizaLogger.log(`Top up ATOMA balance. Digest: ${executedTransaction.digest}; \n Transaction: ${transactionLink}`)
            runtime.cacheManager.set(ATOMA_PAYMENT_CACHE_KEY, false);
        } else if(agentUSDCBalance.isLessThan(threshold)) {
            runtime.cacheManager.set(ATOMA_PAYMENT_CACHE_KEY, true);
            elizaLogger.log('Need to top-up the Agent balance.');
        }
    }
}

