<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# PoolTogether V5

### 🤖 Bots!

Monorepo grouping PoolTogether v5 hyperstructure bots.

## 📖 Tutorials

1. [Creating a PoolTogether Arbitrage Swapping bot](https://mirror.xyz/chuckbergeron-g9.eth/ES-IJduktYPb0X_sBikfqL-PVFRweNpoPrlr01zcVX8)
2. [Creating a PoolTogether Prize Claiming bot](https://mirror.xyz/chuckbergeron-g9.eth/xPSEh1pfjV2IT1yswcsjN2gBBrVf548V8q9W23xxA8U)
3. [Creating a PoolTogether Draw Auction bot](https://mirror.xyz/chuckbergeron-g9.eth/1o-d_ScnJ8F0cer5SRmILMSPxTCn4vlWgN7fkU4FD4o)

## 📦 Packages

- **[library](./packages/library)**: Shared functions which can be installed from any repo, published as `pt-v5-autotasks-library` on NPM.
- **[Arbitrage Liquidator Bot](./packages/liquidator)**: Bot to find arbitrage opportunities and liquidate the prize tokens (likely WETH) for yield.
- **[Draw Auction Bot](./packages/draw-auction)**: Bot to start and complete draws using the DrawAuction system.
- **[Prize Claiming Bot](./packages/prize-claimer)**: Bot to claim prizes on behalf of depositors.

## 🖥️ Development

1. This library uses `yalc` to manage local dependencies. You will need to clone the `pt-v5-utils-js` repo and publish it with `yalc` (you can publish it using `npm run start` after `npm install` in the `pt-v5-utils-js` directory).

2. Following that, make sure to run `npm run yalcadd` before installing to setup local dependencies, and after any recompiles of the `pt-v5-utils-js` package.

3. Start another terminal instance and run `npm run start` in `/packages/library`, this will compile the `@generationsoftware/pt-v5-autotasks-library` and make it available to the other packages in this repo.

4. Finally, run `npm run install` in the root of this package - now you should be able to run `npm run start` in any of the subpackages.
