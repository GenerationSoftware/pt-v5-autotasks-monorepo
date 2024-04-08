<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-draw-auction

![title image for PoolTogether Draw Auction Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/draw-auction/draw-auction-img.png "title image for PoolTogether Draw Auction Bot")

PoolTogether hyperstructure (v5) bot to start the RNG (random number generator) process and complete draws using the resulting winning random number.

## 📖 Tutorial

### [Creating a PoolTogether Draw Auction bot](https://mirror.xyz/chuckbergeron-g9.eth/1o-d_ScnJ8F0cer5SRmILMSPxTCn4vlWgN7fkU4FD4o)

## 🖥️ Usage

### 1. Setup

To run locally or build first set up your environment variables using `dotenv`:

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

### DRAW AUCTION SPECIFIC:

REWARD_RECIPIENT: Address of the contract/EOA account that will receive the profit for starting and relaying the RNG

```

### 2. Start checking draw auctions

When everything is set and the env vars have been exported you can run the bot locally:

```sh
yarn start
```
