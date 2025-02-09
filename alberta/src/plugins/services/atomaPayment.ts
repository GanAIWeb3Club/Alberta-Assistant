import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

import {
    elizaLogger,
    IAgentRuntime,
    Service,
    ServiceType,
} from "@elizaos/core";

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export class AtomaPayment extends Service {
    static serviceType: ServiceType = ServiceType.TRANSCRIPTION;
    private suiClient: SuiClient;
    private network: SuiNetwork;
    private agentAccount: string;
    private atomaAccount: string;
    private coinType: string;

    initialize(runtime: IAgentRuntime): Promise<void> {
        this.suiClient = new SuiClient({
            url: getFullnodeUrl(
                    runtime.getSetting("SUI_NETWORK") as SuiNetwork
            ),
        });
        this.network = runtime.getSetting("SUI_NETWORK") as SuiNetwork;
        this.agentAccount = runtime.getSetting("SUI_AGENT_ACCOUNT");
        elizaLogger.log(`SUI_AGENT_ACCOUNT: ${this.agentAccount}`);
        this.atomaAccount = runtime.getSetting("SUI_ATOMA_ACCOUNT");
        elizaLogger.log(`SUI_ACCOUNT_ACCOUNT: ${this.atomaAccount}`);
        this.coinType = runtime.getSetting("SUI_COIN_TYPE");
        return null;
    }

    /**
     * Fetch the USDC balance for a given address.
     * @param address - The address to query.
     * @returns The USDC balance as a string.
     */
    private async getUSDCBalance(address: string): Promise<string> {
        try {
            const balance = await this.suiClient.getBalance({
                owner: address,
                coinType: this.coinType,
            });
            return balance.totalBalance;
        } catch (error) {
            console.error(`Failed to fetch USDC balance for address ${address}:`, error);
            throw error;
        }
    }

    /**
     * Track USDC balances for the agent and Atoma accounts.
     */
    public async trackUSDCBalances(): Promise<void> {
        try {
            const balanceAgent = await this.getUSDCBalance(this.agentAccount);
            const balanceAtoma = await this.getUSDCBalance(this.atomaAccount);

            elizaLogger.log(`USDC Balance for Agent Account (${this.agentAccount}): ${balanceAgent}`);
            elizaLogger.log(`USDC Balance for Atoma Account (${this.atomaAccount}): ${balanceAtoma}`);
        } catch (error) {
            console.error('Error tracking USDC balances:', error);
        }
    }
}
