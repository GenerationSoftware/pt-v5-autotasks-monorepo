<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-liquidator

![title image for PoolTogether Arbitrage Liquidator Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/liquidator/arb-liquidator-img.png "title image for PoolTogether Arbitrage Liquidator Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to find arbitrage opportunities and liquidate the prize token (likely POOL) for yield.

## 📖 Tutorial

### [Creating a PoolTogether Arbitrage Swapping bot](https://mirror.xyz/chuckbergeron-g9.eth/ES-IJduktYPb0X_sBikfqL-PVFRweNpoPrlr01zcVX8)

## 🖥️ Usage

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

The bulk of determining if an arbitrage is profitable is in **[/packages/library/src/liquidator.ts#L44](../library)**.

### 1. Setup

To run the OpenZeppelin Defender autotask locally or build for OpenZeppelin Defender, first set up your environment variables using `dotenv`:

#### ENV

Copy `.envrc.example` and input the env variables needed to run this project.

```sh
cp .envrc.example .envrc
```

Once your env variables are setup, load them with:

```sh
direnv allow
```

#### LIST OF ENVIRONMENT VARIABLES

```sh
CHAIN_ID: The chain ID of which network to run the autotask on
JSON_RPC_URI: Your Infura/Alchemy/etc JSON RPC URI
COVALENT_API_KEY: (Optional) Your Covalent API key for getting USD values of tokens
USE_FLASHBOTS: boolean, if you would like to keep transactions private from the mempool on chains that support flashbots
MIN_PROFIT_THRESHOLD_USD: the minimum (in USD) you want to profit from each swap (ie. 1 is $1.00)

### THIS:

CUSTOM_RELAYER_PRIVATE_KEY: run liquidations using your own EOA

### OR THIS (recommended):

DEFENDER_TEAM_API_KEY: OZ Defender Team API Key
DEFENDER_TEAM_API_SECRET: OZ Defender Team Secret Key
AUTOTASK_ID: OZ Defender, the ID of the autotask (can get from browser URL bar)
RELAYER_API_KEY: OZ Defender chain Relayer API Key
RELAYER_API_SECRET: OZ Defender chain Relayer API Secret

### LIQUIDATOR SPECIFIC:

SWAP_RECIPIENT: Address of the account that will receive the resulting swap tokens, can set to the relayer address or any other contract/EOA address

```

### 2. Start liquidating

When everything is set and the env vars have been exported you can run the bot locally:

```sh
yarn start
```

### 3. Update remote autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```sh
yarn update
```
