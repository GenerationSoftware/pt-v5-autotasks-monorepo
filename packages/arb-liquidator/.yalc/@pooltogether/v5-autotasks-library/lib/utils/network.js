"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContracts = exports.isTestnet = exports.isMainnet = exports.TESTNET_CHAIN_IDS = exports.ETHEREUM_MAINNET_CHAIN_IDS = exports.ETHEREUM_SEPOLIA_CHAIN_ID = exports.ETHEREUM_GOERLI_CHAIN_ID = exports.ETHEREUM_MAINNET_CHAIN_ID = void 0;
exports.ETHEREUM_MAINNET_CHAIN_ID = 1;
exports.ETHEREUM_GOERLI_CHAIN_ID = 5;
exports.ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;
exports.ETHEREUM_MAINNET_CHAIN_IDS = [exports.ETHEREUM_MAINNET_CHAIN_ID];
exports.TESTNET_CHAIN_IDS = [exports.ETHEREUM_GOERLI_CHAIN_ID, exports.ETHEREUM_SEPOLIA_CHAIN_ID];
const isMainnet = (chainId) => {
    switch (chainId) {
        case exports.ETHEREUM_MAINNET_CHAIN_ID:
            return true;
        default:
            return false;
    }
};
exports.isMainnet = isMainnet;
const isTestnet = (chainId) => {
    switch (chainId) {
        case exports.ETHEREUM_SEPOLIA_CHAIN_ID:
            return true;
        default:
            return false;
    }
};
exports.isTestnet = isTestnet;
const getContracts = (chainId, mainnet, testnet) => {
    if ((0, exports.isMainnet)(chainId)) {
        return mainnet;
    }
    else if ((0, exports.isTestnet)(chainId)) {
        return testnet;
    }
    else {
        throw new Error(`getContracts: Unsupported network ${chainId}`);
    }
};
exports.getContracts = getContracts;
//# sourceMappingURL=network.js.map