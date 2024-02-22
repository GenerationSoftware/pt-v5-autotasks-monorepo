<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-draw-auction

![title image for PoolTogether Draw Auction Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/draw-auction/draw-auction-img.png "title image for PoolTogether Draw Auction Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to start the RNG (random number generator) process and complete draws using the resulting winning random number.

## 📖 Tutorial

### [Creating a PoolTogether Draw Auction bot](https://mirror.xyz/chuckbergeron-g9.eth/1o-d_ScnJ8F0cer5SRmILMSPxTCn4vlWgN7fkU4FD4o)

## 🖥️ Usage

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

### DRAW AUCTION SPECIFIC:

REWARD_RECIPIENT: Address of the contract/EOA account that will receive the profit for starting and relaying the RNG

ARBITRUM_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Arbitrum
OPTIMISM_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Optimism

ARBITRUM_SEPOLIA_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Arbitrum Sepolia
OPTIMISM_SEPOLIA_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Optimism Sepolia
OPTIMISM_GOERLI_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Optimism Goerli

```

### 2. Start checking draw auctions

When everything is set and the env vars have been exported you can run the bot locally:

```sh
yarn start
```

### 3. Update remote autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```sh
yarn update
```
