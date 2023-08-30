<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 @generationsoftware/pt-v5-autotasks-withdraw-claim-rewards - PoolTogether V5

![title image for PoolTogether Withdraw Claim Rewards Sweeper Bot](https://github.com/generationsoftware/pt-v5-autotasks/raw/main/packages/withdraw-claim-rewards/withdraw-rewards-img.png "title image for PoolTogether Withdraw Claim Rewards Sweeper Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to sweep any rewards a prize claimer has accumulated on the prize pool.

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

The following is unique to the prize claim sweeper bot:

```
REWARDS_RECIPIENT: Address of the contract/EOA account that will receive the claim rewards
```

Once the config has been saved with all of those variables, the script will run `withdrawClaimRewards()` and attempt to send a transaction.

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can update the autotask on OZ Defender using:

```
yarn update
```
