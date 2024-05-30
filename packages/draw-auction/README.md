<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-draw-auction

![title image for PoolTogether Draw Auction Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/draw-auction/draw-auction-img.png "title image for PoolTogether Draw Auction Bot")

PoolTogether hyperstructure (v5) bot to start the RNG (random number generator) process and complete draws using the resulting winning random number.

## 📖 Draw Auction Example:

### [PoolTogether Draw Auction GitHub Action bot](https://github.com/GenerationSoftware/pt-v5-draw-auction-gh-action-bot)

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
JSON_RPC_URL: Your Infura/Alchemy/etc JSON RPC URL
COVALENT_API_KEY: Your Covalent API key for getting USD values of tokens
MIN_PROFIT_THRESHOLD_USD: the minimum (in USD) you want to profit from each swap (ie. 1 is $1.00)
CUSTOM_RELAYER_PRIVATE_KEY: send transactions using your own EOA
CONTRACT_JSON_URL: the URL of the JSON file where the contract addresses and ABIs live (typically a commit on GitHub)

### DRAW AUCTION SPECIFIC:

REWARD_RECIPIENT: Address of the account that will receive the profit for starting and finishing the RNG auctions, can be any other contract/EOA address or if blank sets recipient to be the relayer address

```

### 2. Start checking draw auctions

When everything is set and the env vars have been exported you can run the bot locally:

```sh
npm run start
```
