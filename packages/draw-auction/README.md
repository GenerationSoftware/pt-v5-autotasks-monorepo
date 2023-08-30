<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 @generationsoftware/pt-v5-autotasks-draw-auction - PoolTogether V5

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to start the RNG (random number generator) process and complete draws using the resulting winning random number.

## Usage

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

```
RELAY_CHAIN_ID: The network to relay the RNG to (ie. RNG starts on ETH mainnet, gets relayed to Optimism)
RELAY_RELAYER_API_KEY: The OpenZeppelin transaction relayer API key for the relay PrizePool chain
RELAY_RELAYER_API_SECRET: The OpenZeppelin transaction relayer API secret for the relay PrizePool chain
RELAY_JSON_RPC_URI: The Infura/Alchemy/etc JSON RPC URI for the relay PrizePool chain
REWARD_RECIPIENT: Address of the contract/EOA account that will receive the profit for starting and completing the RNG?
```

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```
yarn update
```
