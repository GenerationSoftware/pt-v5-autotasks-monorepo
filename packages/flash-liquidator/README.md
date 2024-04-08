<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-flash-liquidator

PoolTogether hyperstructure (v5) bot to find arbitrage opportunities and only pay for gas (in ETH) in exchange for yield.

## 🖥️ Usage

This package is a CLI for running the bot locally.

Most code for determining if a liquidation is profitable is in **[/packages/library/src/liquidator.ts#L44](../library)**.

### 1. Setup

To run the bot locally first set up your environment variables using `dotenv`:

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
MIN_PROFIT_THRESHOLD_USD: the minimum (in USD) you want to profit from each swap (ie. 1 is $1.00)
CUSTOM_RELAYER_PRIVATE_KEY: send transactions using your own EOA

### FLASH LIQUIDATOR SPECIFIC:

SWAP_RECIPIENT: Address of the account that will receive the resulting swap tokens, can set to the relayer address or any other contract/EOA address

```

### 2. Start liquidating

When everything is set and the env vars have been exported you can run the bot locally:

```sh
npm run start
```
