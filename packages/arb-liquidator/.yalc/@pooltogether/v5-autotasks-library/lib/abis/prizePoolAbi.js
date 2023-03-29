"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrizePoolAbi = void 0;
exports.PrizePoolAbi = [
    {
        inputs: [
            {
                internalType: "contract IERC20",
                name: "_prizeToken",
                type: "address",
            },
            {
                internalType: "contract TwabController",
                name: "_twabController",
                type: "address",
            },
            {
                internalType: "uint32",
                name: "_grandPrizePeriodDraws",
                type: "uint32",
            },
            {
                internalType: "uint32",
                name: "_drawPeriodSeconds",
                type: "uint32",
            },
            {
                internalType: "uint64",
                name: "nextDrawStartsAt_",
                type: "uint64",
            },
            {
                internalType: "uint8",
                name: "_numberOfTiers",
                type: "uint8",
            },
            {
                internalType: "uint96",
                name: "_tierShares",
                type: "uint96",
            },
            {
                internalType: "uint96",
                name: "_canaryShares",
                type: "uint96",
            },
            {
                internalType: "uint96",
                name: "_reserveShares",
                type: "uint96",
            },
            {
                internalType: "UD2x18",
                name: "_claimExpansionThreshold",
                type: "uint64",
            },
            {
                internalType: "SD1x18",
                name: "_alpha",
                type: "int64",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "x",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "y",
                type: "uint256",
            },
        ],
        name: "PRBMath_MulDiv18_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "x",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "y",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "denominator",
                type: "uint256",
            },
        ],
        name: "PRBMath_MulDiv_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "SD59x18",
                name: "x",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Ceil_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "int256",
                name: "x",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Convert_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "int256",
                name: "x",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Convert_Underflow",
        type: "error",
    },
    {
        inputs: [],
        name: "PRBMath_SD59x18_Div_InputTooSmall",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "SD59x18",
                name: "x",
                type: "int256",
            },
            {
                internalType: "SD59x18",
                name: "y",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Div_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "SD59x18",
                name: "x",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Exp2_InputTooBig",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "SD59x18",
                name: "x",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Log_InputTooSmall",
        type: "error",
    },
    {
        inputs: [],
        name: "PRBMath_SD59x18_Mul_InputTooSmall",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "SD59x18",
                name: "x",
                type: "int256",
            },
            {
                internalType: "SD59x18",
                name: "y",
                type: "int256",
            },
        ],
        name: "PRBMath_SD59x18_Mul_Overflow",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "x",
                type: "uint256",
            },
        ],
        name: "PRBMath_UD60x18_Convert_Overflow",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint32",
                name: "drawId",
                type: "uint32",
            },
            {
                indexed: true,
                internalType: "address",
                name: "vault",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "winner",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "tier",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint152",
                name: "payout",
                type: "uint152",
            },
            {
                indexed: false,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint96",
                name: "fee",
                type: "uint96",
            },
            {
                indexed: false,
                internalType: "address",
                name: "feeRecipient",
                type: "address",
            },
        ],
        name: "ClaimedPrize",
        type: "event",
    },
    {
        inputs: [],
        name: "_reserve",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "_winningRandomNumber",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "alpha",
        outputs: [
            {
                internalType: "SD1x18",
                name: "",
                type: "int64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "calculatePrizeSize",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "calculateTierTwabTimestamps",
        outputs: [
            {
                internalType: "uint64",
                name: "startTimestamp",
                type: "uint64",
            },
            {
                internalType: "uint64",
                name: "endTimestamp",
                type: "uint64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "canaryClaimCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_numTiers",
                type: "uint8",
            },
        ],
        name: "canaryPrizeCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "canaryPrizeCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "numTiers",
                type: "uint8",
            },
        ],
        name: "canaryPrizeCountMultiplier",
        outputs: [
            {
                internalType: "UD60x18",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "canaryShares",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "claimCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "claimExpansionThreshold",
        outputs: [
            {
                internalType: "UD2x18",
                name: "",
                type: "uint64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_winner",
                type: "address",
            },
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
            {
                internalType: "address",
                name: "_to",
                type: "address",
            },
            {
                internalType: "uint96",
                name: "_fee",
                type: "uint96",
            },
            {
                internalType: "address",
                name: "_feeRecipient",
                type: "address",
            },
        ],
        name: "claimPrize",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "winningRandomNumber_",
                type: "uint256",
            },
        ],
        name: "completeAndStartNextDraw",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_prizeVault",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
            },
        ],
        name: "contributePrizeTokens",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "drawPeriodSeconds",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "numTiers",
                type: "uint8",
            },
        ],
        name: "estimatedPrizeCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "estimatedPrizeCount",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_vault",
                type: "address",
            },
            {
                internalType: "uint32",
                name: "_startDrawIdInclusive",
                type: "uint32",
            },
            {
                internalType: "uint32",
                name: "_endDrawIdInclusive",
                type: "uint32",
            },
        ],
        name: "getContributedBetween",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getLastCompletedDrawId",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getNextDrawId",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "getTierAccrualDurationInDraws",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "getTierLiquidity",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "getTierPrizeCount",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "pure",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint32",
                name: "_startDrawIdInclusive",
                type: "uint32",
            },
            {
                internalType: "uint32",
                name: "_endDrawIdInclusive",
                type: "uint32",
            },
        ],
        name: "getTotalContributedBetween",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getTotalShares",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_vault",
                type: "address",
            },
            {
                internalType: "uint32",
                name: "startDrawId",
                type: "uint32",
            },
            {
                internalType: "uint32",
                name: "endDrawId",
                type: "uint32",
            },
        ],
        name: "getVaultPortion",
        outputs: [
            {
                internalType: "SD59x18",
                name: "",
                type: "int256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_vault",
                type: "address",
            },
            {
                internalType: "address",
                name: "_user",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_drawDuration",
                type: "uint256",
            },
        ],
        name: "getVaultUserBalanceAndTotalSupplyTwab",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getWinningRandomNumber",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "grandPrizePeriodDraws",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_vault",
                type: "address",
            },
            {
                internalType: "address",
                name: "_user",
                type: "address",
            },
            {
                internalType: "uint8",
                name: "_tier",
                type: "uint8",
            },
        ],
        name: "isWinner",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "largestTierClaimed",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "lastCompletedDrawId",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "lastCompletedDrawStartedAt",
        outputs: [
            {
                internalType: "uint64",
                name: "",
                type: "uint64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "nextDrawEndsAt",
        outputs: [
            {
                internalType: "uint64",
                name: "",
                type: "uint64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "nextDrawStartsAt",
        outputs: [
            {
                internalType: "uint64",
                name: "",
                type: "uint64",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "numberOfTiers",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "prizeToken",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "prizeTokenPerShare",
        outputs: [
            {
                internalType: "UD60x18",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "reserve",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "reserveShares",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "tierShares",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalDrawLiquidity",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "twabController",
        outputs: [
            {
                internalType: "contract TwabController",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
            },
        ],
        name: "withdrawReserve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
//# sourceMappingURL=prizePoolAbi.js.map