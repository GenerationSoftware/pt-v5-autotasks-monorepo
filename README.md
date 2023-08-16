# v5-autotasks

Monorepo grouping PoolTogether hyperstructure (v5) bots as OpenZeppelin Defender autotasks.

## Installation

1. This library uses `yalc` to manage local dependencies. You will need to clone the `pt-v5-utils-js` repo and publish it (you can publish it using `yarn start` after `yarn install` in the `pt-v5-utils-js` directory).

2. Following that, make sure to run `yarn yalcadd` before installing to setup local dependencies.

3. Finally, run `yarn install` in the root of this package. You can now run `yarn start` in any of the subpackages.

## Development

- **[library](./packages/library)**: Shared functions which can be installed from any repo, published as `v5-autotasks-library` on NPM.
- **[Arbitrage Liquidator Bot](./packages/arb-liquidator)**: OpenZeppelin Defender autotask to find arbitrage opportunities and liquidate the prize token (likely POOL) for yield.
- **[Draw Auction Bot](./packages/draw-auction)**: OpenZeppelin Defender autotask to start and complete draws using the DrawAuction system.
- **[Prize Claiming Bot](./packages/prize-claimer)**: OpenZeppelin Defender autotask to claim prizes on behalf of depositors.
- **[Withdraw Claim Rewards Bot](./packages/withdraw-claim-rewards)**: OpenZeppelin Defender autotask to find arbitrage opportunities and liquidate the prize token (likely POOL) for yield.
- **[YieldVault MintRate Bot (testnet only)](./packages/yieldvault-mintrate)**: OpenZeppelin Defender autotask to touch the MintRate on each YieldVault.
