# v5-autotasks

Monorepo grouping PoolTogether hyperstructure (v5) bots as OpenZeppelin Defender autotasks.

## Installation

This library uses `yalc` to manage local dependencies. Make sure to run `yarn yalcadd` after install to setup local dependencies.

## Development

- **[library](./packages/library)**: Shared functions which can be installed from any repo, published as `v5-autotasks-library` on NPM.
- **[arb-liquidator](./packages/arb-liquidator)**: OpenZeppelin Defender autotask to find arbitrage opportunities and liquidate the prize token (likely POOL) for yield.
- **[prize-claimer](./packages/prize-claimer)**: OpenZeppelin Defender autotask to claim prizes on behalf of depositors.
- **[draw-beacon](./packages/draw-beacon)**: OpenZeppelin Defender autotask to start and complete a draw.
- **[testnet-complete-draw](./packages/testnet-complete-draw)**: OpenZeppelin Defender autotask to start and complete a draw on a TestNet PrizePool.
- **[yieldvault-mintrate](./packages/yieldvault-mintrate)**: OpenZeppelin Defender autotask to touch the MintRate on each YieldVault.
