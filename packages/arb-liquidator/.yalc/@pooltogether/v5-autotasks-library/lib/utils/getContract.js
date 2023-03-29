"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContract = void 0;
const getContracts_1 = require("./getContracts");
const debug = require("debug")("pt-autotask-lib");
function getContract(name, chainId, providerOrSigner, contractsBlob, version = {
    major: 1,
    minor: 0,
    patch: 0,
}) {
    return (0, getContracts_1.getContracts)(name, chainId, providerOrSigner, contractsBlob, version)[0];
}
exports.getContract = getContract;
//# sourceMappingURL=getContract.js.map