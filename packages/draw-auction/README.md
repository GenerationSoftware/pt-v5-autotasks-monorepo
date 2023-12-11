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

### 1. Run autotask

To run the OpenZeppelin Defender autotask locally, first set up your environment variables using `dotenv`:

#### ENV

Copy `.envrc.example` and write down the env variables needed to run this project.

```
cp .envrc.example .envrc
```

Once your env variables are setup, load them with:

```
direnv allow
```

#### LIST OF ENVIRONMENT VARIABLES

```
CHAIN_ID: The chain ID of which network to run the autotask on
JSON_RPC_URI: Your Infura/Alchemy/etc JSON RPC URI
COVALENT_API_KEY: (Optional) Your Covalent API key for getting USD values of tokens
```

Either one of the following:

```
CUSTOM_RELAYER_PRIVATE_KEY: Your own EOA private key to use to relay transactions
```

or for OpenZeppelin Defender:

```
DEFENDER_TEAM_API_KEY: OZ Defender Team API Key
DEFENDER_TEAM_API_KEY: OZ Defender Team Secret Key
AUTOTASK_ID: OZ Defender, the ID of the autotask (can get from browser URL bar)
RELAYER_API_KEY: OZ Defender chain Relayer API Key
RELAYER_API_SECRET: OZ Defender chain Relayer API Secret
```

The following is unique to the Draw Auction bot:

```
REWARD_RECIPIENT: Address of the contract/EOA account that will receive the profit for starting and relaying the RNG

RELAY_CHAIN_IDS: A comma-seperated list of network IDs to relay the RNG to (ie. RNG starts on ETH mainnet, gets relayed to Optimism, Arbitrum, etc.) ex. for Optimism and Arbitrum enter: 42161,10

ARBITRUM_RELAY_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Arbitrum
OPTIMISM_RELAY_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Optimism

ARBITRUM_SEPOLIA_RELAY_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Arbitrum
OPTIMISM_SEPOLIA_RELAY_JSON_RPC_URI: Infura/Alchemy/etc JSON RPC URI for the relay chain on Optimism
```

#### START THE BOT

```
yarn start
```

### 2. Update autotask

If everything looks good, you can upload the task to OZ Defender to be run periodically.

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

`yarn update`
