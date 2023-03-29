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
exports.claimerHandleClaimPrize = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
const debug = require("debug")("pt-autotask-lib");
function claimerHandleClaimPrize(contracts, config, feeRecipient) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, provider } = config;
        const claimer = (0, utils_1.getContract)("Claimer", chainId, provider, contracts);
        const vaults = (0, utils_1.getContracts)("Vault", chainId, provider, contracts);
        console.log(vaults);
        if (!claimer) {
            throw new Error("Claimer: Contract Unavailable");
        }
        if (vaults.length === 0) {
            throw new Error("Claimer: No Vault contracts found");
        }
        let transactionsPopulated = [];
        for (let i = 0; i < vaults.length; i++) {
            const vault = vaults[i];
            const winners = [];
            const tiers = [];
            const minFees = "asdf";
            const params = {
                vaultAddress: vault.address,
                winners,
                tiers,
                minFees,
                feeRecipient,
            };
            const feeData = yield getFeeData(provider);
            console.log("feeData ? ", feeData);
            const earnedFees = yield claimer.callStatic.claimPrize(params);
            console.log("earnedFees ? ", earnedFees);
            const gasEstimate = yield getGasEstimate(claimer, params);
            console.log("gasEstimate ? ", gasEstimate);
            const prizesToClaim = 0;
            if (prizesToClaim > 0) {
                console.log("Claimer: Start Claim Prizes");
                transactionsPopulated.push(yield claimer.populateTransaction.claimPrize(vault.address, winners, tiers, minFees, feeRecipient));
            }
            else {
                console.log(`Claimer: No Prizes found to claim for Vault: ${vault.address}.`);
            }
        }
        return transactionsPopulated;
    });
}
exports.claimerHandleClaimPrize = claimerHandleClaimPrize;
const getGasEstimate = (claimer, params) => __awaiter(void 0, void 0, void 0, function* () {
    let gasEstimate;
    gasEstimate = yield claimer.estimateGas.claimPrize(params);
    return gasEstimate;
});
const getFeeData = (provider) => __awaiter(void 0, void 0, void 0, function* () {
    const feeData = yield provider.getFeeData();
    return ethers_1.ethers.utils.formatUnits(feeData.maxFeePerGas, "gwei");
});
//# sourceMappingURL=claimerHandleClaimPrize.js.map