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

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

### 1. Run autotask

To run the OpenZeppelin Defender autotask locally:

```
yarn start
```

You will be prompted to fill in the following necessary variables:

```
CHAIN_ID: The chain ID of which network to run the autotask on
DEFENDER_TEAM_API_KEY: OZ Defender Team API Key
DEFENDER_TEAM_API_KEY: OZ Defender Team Secret Key
AUTOTASK_ID: OZ Defender, the ID of the autotask (can get from browser URL bar)
RELAYER_API_KEY: OZ Defender chain Relayer API Key
RELAYER_API_SECRET: OZ Defender chain Relayer API Secret
JSON_RPC_URI: Your Infura/Alchemy/etc JSON RPC URI
COVALENT_API_KEY: (Optional) Your Covalent API key for getting USD values of tokens
```

The following is unique to the Draw Auction bot:

````
REWARD_RECIPIENT: Address of the contract/EOA account that will receive the profit for starting and completing the RNG?

RELAYS: {}
 - RELAY_CHAIN_ID: The network to relay the RNG to (ie. RNG starts on ETH mainnet, gets relayed to Optimism)
 - RELAY_JSON_RPC_URI: The Infura/Alchemy/etc JSON RPC URI for the relay PrizePool chain

```

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

`yarn update`
````
