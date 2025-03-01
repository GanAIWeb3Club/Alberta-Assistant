import { Evaluator, HandlerCallback, IAgentRuntime, Memory, State, elizaLogger } from "@elizaos/core";
import { notifyUserAboutAtomaPayments, topUpAtomaBalanceStatus } from "../actions/utils.ts";

/**
 * @fileoverview Evaluator for monitoring and managing Atoma balance status
 */



/**
 * Evaluator that checks and manages Atoma balance status
 * @type {Evaluator}
 * @remarks The execution of this evaluator depends on the client implementation.
 * Different clients may handle the callback parameter differently.
 */
export const balanceEvaluator: Evaluator = {
    /** Unique identifier for the evaluator */
    name: "BALANCE_EVALUATOR",
    /** Related evaluators */
    similes: ["ACCOUNT_EVALUATOR"],
    /** Indicates that this evaluator should run on every message */
    alwaysRun: true,
    /** Brief description of the evaluator's purpose */
    description: "Evaluates Agent and Atoma balances",
    /**
     * Validates whether the evaluator should process the message
     * @param {IAgentRuntime} runtime - The agent runtime environment
     * @param {Memory} message - The message to validate
     * @returns {Promise<boolean>} Always returns true as this evaluator runs on all messages
     */
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    /**
     * Handles the balance evaluation and notification logic
     * @param {IAgentRuntime} runtime - The agent runtime environment
     * @param {Memory} message - The message being processed
     * @param {State} [state] - Optional state object
     * @param {Object} [options] - Optional configuration options
     * @param {HandlerCallback} [callback] - Optional callback function
     * @returns {Promise<void>}
     */
    handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: {
        [key: string]: unknown;
    }, callback?: HandlerCallback): Promise<void> => {
        elizaLogger.debug('balanceEvaluator handler.');
        if(await topUpAtomaBalanceStatus(runtime)){
            // Depends on the Client implementation. Some clients don't pass callback parameter.
            if (callback && typeof callback === 'function') {
                await notifyUserAboutAtomaPayments(message, callback);
            }
        }
        return;
    },
    examples: []
};