# v5-autotasks

Monorepo grouping PoolTogether hyperstructure (v5) bots as OpenZeppelin Defender autotasks.

## Development

- **[library](./packages/library)**: Shared functions which can be installed from any repo, published as `v5-autotasks-library` on NPM.
- **arb-liquidator**: OpenZeppelin Defender autotask to find arbitrage opportunities and liquidate the prize token (likely POOL) for yield.
- **prize-claimer**: OpenZeppelin Defender autotask to claim prizes on behalf of depositors.
- **draw-beacon**: OpenZeppelin Defender autotask to start and complete a draw.
- **testnet-complete-draw**: OpenZeppelin Defender autotask to start and complete a draw on a TestNet PrizePool.
- **yieldvault-mintrate**: OpenZeppelin Defender autotask to touch the MintRate on each YieldVault.

### Todo:

- ArbLiquidator bot could benefit from multicall reads to speed it up
