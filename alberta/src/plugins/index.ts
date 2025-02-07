import type { Plugin } from "@elizaos/core";
import { scanPorts } from "./actions/scanPorts.ts";
import { validateNodeConnection } from "./actions/validateNodeConectivity.ts";

export const nodePlugin: Plugin = {
    name: "Node scanner",
    description: "Agent bootstrap with basic actions and evaluators",
    actions: [
        validateNodeConnection,
        scanPorts,
    ]
};
export default nodePlugin;
