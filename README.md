<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# PoolTogether V5

### 🤖 Bots!

Monorepo grouping together the latest PoolTogether v5 hyperstructure bots.

**NOTE ON NODE VERSIONS: Requires Node v20 or greater**

## 📖 Examples

1. [Creating a PoolTogether Liquidator bot](https://github.com/GenerationSoftware/pt-v5-liquidator-gh-action-bot)
2. [Creating a PoolTogether Prize Claimer bot](https://github.com/GenerationSoftware/pt-v5-prize-claimer-gh-action-bot)
3. [Creating a PoolTogether Draw Auction bot](https://github.com/GenerationSoftware/pt-v5-draw-auction-gh-action-bot)

## 📦 Packages

- **[library](./packages/library)**: Shared functions which can be installed from any repo, published as `pt-v5-autotasks-library` on NPM.
- **[Arbitrage Liquidator Bot](./packages/liquidator)**: Bot to find arbitrage opportunities and liquidate the prize tokens (likely WETH) for yield.
- **[Draw Auction Bot](./packages/draw-auction)**: Bot to start and complete draws using the DrawAuction system.
- **[Prize Claiming Bot](./packages/prize-claimer)**: Bot to claim prizes on behalf of depositors.

## 🖥️ Development

Run `npm run install` in the root of this package - if all goes well you should be able to run `npm run start` in any of the subpackages.
