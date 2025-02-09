import { AtomaPayment } from "../services/atomaPayment";

import {
    elizaLogger,
    IAgentRuntime,
    ServiceType,
    Memory,
    Provider,
    State,
} from "@elizaos/core";




export const atomaProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<void> => {
        const suiService = runtime.getService<AtomaPayment>(ServiceType.TRANSCRIPTION);
        suiService.trackUSDCBalances();
    }
}

