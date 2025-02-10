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
        elizaLogger.log(`SUI_ATOMA_ACCOUNT: ${this.atomaAccount}`);
        this.coinType = runtime.getSetting("SUI_COIN_TYPE");
        return null;
    }

    /**
     * Returns the initialized Sui Client instance.
     * @returns {SuiClient} The SuiClient instance used for interacting with the Sui network.
     */
    public getSuiClient(): SuiClient {
        return this.suiClient;
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
            elizaLogger.error(`Failed to fetch USDC balance for address ${address}:`, error);
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

            const dollarBalanceAgent = (Number(balanceAgent) / 1000000).toFixed(2);
            const dollarBalanceAtoma = (Number(balanceAtoma) / 1000000).toFixed(2); 

            // Log the balances in USD format
            elizaLogger.log(`USDC Balance for Agent Account (${this.agentAccount}): $${dollarBalanceAgent}`);
            elizaLogger.log(`USDC Balance for Atoma Account (${this.atomaAccount}): $${dollarBalanceAtoma}`);

        } catch (error) {
            elizaLogger.error('Error tracking USDC balances:', error);
        }
    }

    public async getAgentUSDCBalances(): Promise<string> {
        try {
            const agentBalance = await this.getUSDCBalance(this.agentAccount);
            elizaLogger.log(`USDC Balance for Agent Account (${this.agentAccount}): ${agentBalance}`);
            return agentBalance;
        } catch (error) {
            elizaLogger.error('Error tracking Agent USDC balances:', error);
        }
    }

    public async getAtomaUSDCBalances(): Promise<string> {
        try {
            const atomaBalance = await this.getUSDCBalance(this.atomaAccount);
            elizaLogger.log(`USDC Balance for Agent Account (${this.atomaAccount}): ${atomaBalance}`);
            return atomaBalance;
        } catch (error) {
            elizaLogger.error('Error tracking Atoma USDC balances:', error);
        }
    }

    /**
     * Returns the agent's account address.
     * @returns {string} The Sui address of the agent's account.
     */
    public getAgentAccount(): string {
        return this.agentAccount;
    }

    /**
     * Returns the Atoma account address.
     * @returns {string} The Sui address of the Atoma account.
     */
    public getAtomaAccount(): string {
        return this.atomaAccount;
    }

    /**
     * Returns the coin type (by default it's USDC type, but it's specific for SUI network).
     * @returns {string} The coin type.
     */
    public getCoinType(): string {
        return this.coinType;
    }

    /**
     * Returns SUI NETWORK.
     * @returns {SuiNetwork} SUI NETWORK.
     */
    public getNetwork(): SuiNetwork {
        return this.network;
    }

}
