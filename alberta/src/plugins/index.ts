import type { Plugin } from "@elizaos/core";
import { scanPorts } from "./actions/scanPorts.ts";
import { validateNodeConnection } from "./actions/validateNodeConectivity.ts";
import { atomaProvider } from "./providers/atomaProvider.ts";
import { AtomaPayment } from "./services/atomaPayment.ts";

export const nodePlugin: Plugin = {
    name: "Node scanner",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [
        validateNodeConnection,
        scanPorts,
    ],
    providers: [ atomaProvider ],
    services: [new AtomaPayment()],
};
export default nodePlugin;
