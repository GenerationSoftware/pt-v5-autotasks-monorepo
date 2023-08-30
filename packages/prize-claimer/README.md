<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-prize-claimer

![title image for PoolTogether Prize Claimer Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/prize-claimer/prize-claim-img.png "title image for PoolTogether Prize Claimer Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to claim prizes on behalf of depositors.

## Usage

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

The bulk of determining if a claim is profitable is in the **[/packages/library/src/claimerProfitablePrizeTxs.ts#L58](../library)**.

Typically this would be paired with the withdraw-claim-rewards bot in this monorepo, which will periodically sweep rewards profit to an EVM account.

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

The following is unique to the prize claimer bot:

```
FEE_RECIPIENT: Address of the contract/EOA account that will receive the profit for claiming prizes on other's behalf
```

Once the config has been saved with all of those variables, the script will run `executeClaimerProfitablePrizeTxs()` and attempt to send prize claim transactions.

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```
yarn update
```
