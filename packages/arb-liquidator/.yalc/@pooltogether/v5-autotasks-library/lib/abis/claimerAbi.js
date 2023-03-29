"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimerAbi = void 0;
exports.ClaimerAbi = [
    {
        inputs: [
            { internalType: "contract PrizePool", name: "_prizePool", type: "address" },
            { internalType: "UD2x18", name: "_priceDeltaScale", type: "uint64" },
            { internalType: "uint256", name: "_targetPrice", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            { internalType: "uint256", name: "x", type: "uint256" },
            { internalType: "uint256", name: "y", type: "uint256" },
            { internalType: "uint256", name: "denominator", type: "uint256" },
        ],
        name: "PRBMath_MulDiv_Overflow",
        type: "error",
    },
    {
        inputs: [{ internalType: "int256", name: "x", type: "int256" }],
        name: "PRBMath_SD59x18_Convert_Overflow",
        type: "error",
    },
    {
        inputs: [{ internalType: "int256", name: "x", type: "int256" }],
        name: "PRBMath_SD59x18_Convert_Underflow",
        type: "error",
    },
    { inputs: [], name: "PRBMath_SD59x18_Div_InputTooSmall", type: "error" },
    {
        inputs: [
            { internalType: "SD59x18", name: "x", type: "int256" },
            { internalType: "SD59x18", name: "y", type: "int256" },
        ],
        name: "PRBMath_SD59x18_Div_Overflow",
        type: "error",
    },
    {
        inputs: [
            { internalType: "contract IVault", name: "_vault", type: "address" },
            { internalType: "address[]", name: "_winners", type: "address[]" },
            { internalType: "uint8[]", name: "_tiers", type: "uint8[]" },
            { internalType: "uint256", name: "_minFees", type: "uint256" },
            { internalType: "address", name: "_feeRecipient", type: "address" },
        ],
        name: "claimPrizes",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "decayConstant",
        outputs: [{ internalType: "SD59x18", name: "", type: "int256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_claimCount", type: "uint256" }],
        name: "estimateFees",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "prizePool",
        outputs: [{ internalType: "contract PrizePool", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "targetPrice",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
];
//# sourceMappingURL=claimerAbi.js.map