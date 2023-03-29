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
exports.testnetPrizePoolHandleCompletePrize = void 0;
const utils_1 = require("./utils");
function testnetPrizePoolHandleCompletePrize(contracts, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, provider } = config;
        const prizePool = (0, utils_1.getContract)("PrizePool", chainId, provider, contracts);
        if (!prizePool) {
            throw new Error("TestNet PrizePool: Contract Unavailable");
        }
        const nextDrawEndsAt = yield prizePool.nextDrawEndsAt();
        const canCompleteDraw = Date.now() / 1000 > nextDrawEndsAt;
        console.log("Next draw ends at:", nextDrawEndsAt);
        console.log("Date.now():", Date.now());
        console.log("Can Complete Draw:", canCompleteDraw);
        let transactionPopulated;
        if (canCompleteDraw) {
            console.log("TestNet PrizePool: Completing Draw");
            const randNum = Math.floor(Math.random() * Math.pow(10, 10));
            transactionPopulated = yield prizePool.populateTransaction.completeAndStartNextDraw(randNum);
        }
        else {
            console.log(`TestNet PrizePool: Draw not ready to start.\nReady in ${nextDrawEndsAt - Date.now() / 1000} seconds`);
        }
        return transactionPopulated;
    });
}
exports.testnetPrizePoolHandleCompletePrize = testnetPrizePoolHandleCompletePrize;
//# sourceMappingURL=testnetPrizePoolHandleCompletePrize.js.map