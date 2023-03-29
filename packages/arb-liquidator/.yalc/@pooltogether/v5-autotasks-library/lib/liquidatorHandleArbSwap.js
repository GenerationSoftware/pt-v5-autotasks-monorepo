"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liquidatorHandleArbSwap = void 0;
const utils_1 = require("./utils");
const debug = require("debug")("pt-autotask-lib");
const MIN_PROFIT = 1;
const PRIZE_TOKEN_PRICE_USD = 1.02;
function liquidatorHandleArbSwap(contracts, config, swapRecipient) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, provider } = config;
        const liquidationPairs = (0, utils_1.getContracts)("LiquidationPair", chainId, provider, contracts);
        if (liquidationPairs.length === 0) {
            throw new Error("LiquidationPairs: Contracts Unavailable");
        }
        const liquidationPair = liquidationPairs[0];
        const maxAmountOut = yield liquidationPair.callStatic.maxAmountOut();
        console.log("maxAmountOut ", maxAmountOut);
        console.log(swapRecipient);
        const relayerYieldTokenBalance = "MOCK";
        const amountOut = relayerYieldTokenBalance < maxAmountOut ? relayerYieldTokenBalance : maxAmountOut;
        const amountIn = yield liquidationPair.callStatic.computeExactAmountIn(amountOut);
        console.log("amountIn:", amountIn);
        let transactionPopulated;
        const gasCosts = 0.1;
        const profitable = true;
        if (profitable) {
            transactionPopulated = yield liquidationPair.populateTransaction.swapExactAmountIn(swapRecipient, amountIn, maxAmountOut);
            console.log("LiquidationPair: Swapping");
        }
        else {
            console.log(`LiquidationPair: Could not find a profitable trade.`);
        }
        return transactionPopulated;
    });
}
exports.liquidatorHandleArbSwap = liquidatorHandleArbSwap;
//# sourceMappingURL=liquidatorHandleArbSwap.js.map