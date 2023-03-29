"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContracts = void 0;
const ethers_1 = require("ethers");
const debug = require("debug")("pt-autotask-lib");
function getContracts(name, chainId, providerOrSigner, contractsBlob, version = {
    major: 1,
    minor: 0,
    patch: 0,
}) {
    debug("name:", name);
    debug("chainId:", chainId);
    if (!name || !chainId)
        throw new Error(`Invalid Contract Parameters`);
    const contracts = contractsBlob.contracts
        .filter((cont) => cont.type === name && cont.chainId === chainId)
        .filter((contract) => JSON.stringify(contract.version) === JSON.stringify(version));
    let contractsArray = [];
    for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];
        if (contract) {
            contractsArray.push(new ethers_1.ethers.Contract(contract.address, contract.abi, providerOrSigner));
        }
    }
    if (contractsArray.length === 0) {
        throw new Error(`Multiple Contracts Unavailable: ${name} on chainId: ${chainId} `);
    }
    else {
        return contractsArray;
    }
}
exports.getContracts = getContracts;
//# sourceMappingURL=getContracts.js.map