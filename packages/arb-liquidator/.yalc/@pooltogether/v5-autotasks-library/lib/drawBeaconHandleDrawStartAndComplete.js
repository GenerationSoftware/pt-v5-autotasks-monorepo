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
exports.drawBeaconHandleDrawStartAndComplete = void 0;
const utils_1 = require("./utils");
const debug = require("debug")("pt-autotask-lib");
function drawBeaconHandleDrawStartAndComplete(contracts, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, provider } = config;
        const drawBeacon = (0, utils_1.getContract)("DrawBeacon", chainId, provider, contracts);
        if (!drawBeacon) {
            throw new Error("DrawBeacon: Contract Unavailable");
        }
        const nextDrawId = yield drawBeacon.getNextDrawId();
        const beaconPeriodEndAt = yield drawBeacon.beaconPeriodEndAt();
        const beaconPeriodStartedAt = yield drawBeacon.getBeaconPeriodStartedAt();
        const isRngRequested = yield drawBeacon.isRngRequested();
        const isRngCompleted = yield drawBeacon.isRngCompleted();
        const isBeaconPeriodOver = yield drawBeacon.isRngRequested();
        const beaconPeriodSeconds = yield drawBeacon.getBeaconPeriodSeconds();
        const canStartDraw = yield drawBeacon.canStartDraw();
        const canCompleteDraw = yield drawBeacon.canCompleteDraw();
        debug("DrawBeacon next Draw.drawId:", nextDrawId);
        debug("DrawBeacon Beacon PeriodStartedAt:", beaconPeriodStartedAt.toString());
        debug("DrawBeacon Beacon PeriodSeconds:", beaconPeriodSeconds.toString());
        debug("DrawBeacon Beacon PeriodOver:", isBeaconPeriodOver);
        debug("Is RNG Requested:", isRngRequested);
        debug("Can Start Draw:", canStartDraw);
        debug("Can Complete Draw:", canCompleteDraw);
        let transactionPopulated;
        if (canStartDraw) {
            console.log("DrawBeacon: Starting Draw");
            transactionPopulated = yield drawBeacon.populateTransaction.startDraw();
        }
        else if (!canCompleteDraw) {
            console.log(`DrawBeacon: Draw ${nextDrawId} not ready to start.\nBeaconPeriodEndAt: ${beaconPeriodEndAt}`);
        }
        if (canCompleteDraw) {
            console.log("DrawBeacon: Completing Draw");
            transactionPopulated = yield drawBeacon.populateTransaction.completeDraw();
        }
        else if (!canStartDraw) {
            console.log(`DrawBeacon: Draw ${nextDrawId} not ready to complete.\nIsRngRequested: ${isRngRequested}\nIsRngCompleted: ${isRngCompleted}`);
        }
        return transactionPopulated;
    });
}
exports.drawBeaconHandleDrawStartAndComplete = drawBeaconHandleDrawStartAndComplete;
//# sourceMappingURL=drawBeaconHandleDrawStartAndComplete.js.map