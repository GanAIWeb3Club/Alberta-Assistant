import type { Plugin } from "@elizaos/core";
import { accountStatus } from "./actions/accountState.ts";
import { phishingCheckAction } from "./actions/phishingCheck.ts";
import { scanPorts } from "./actions/scanPorts.ts";
import { validateNodeConnection } from "./actions/validateNodeConectivity.ts";
import { balanceEvaluator } from "./evaluators/atomaBalance.ts";
import { atomaProvider } from "./providers/atomaProvider.ts";
import { AtomaPayment } from "./services/atomaPayment.ts";

export const nodePlugin: Plugin = {
    name: "Node scanner",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [
        phishingCheckAction,
        validateNodeConnection,
        scanPorts,
        accountStatus,
    ],
    evaluators: [ balanceEvaluator ],
    providers: [ atomaProvider ],
    services: [new AtomaPayment()],
};
export default nodePlugin;
