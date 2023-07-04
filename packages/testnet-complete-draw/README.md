# @generationsoftware/pt-v5-autotasks-testnet-prizepool

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to start and complete a draw on a TestNet PrizePool.

## Usage

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

The code for moving the PrizePool forward on testnets is in **[/packages/library/src/testnetPrizePoolHandleCompletePrize.ts](../library)**.

## Note:

If you would rather use something other than OZ Defender/Infura, you can import the `v5-autotasks-library` into your own code. More info here: **[v5-autotasks-library](../library#usage)**

### 1. Run autotask

To run the OpenZeppelin Defender autotask locally:

```
yarn start
```

You will be prompted to fill in the following necessary variables:

```
CHAIN_ID: Which network to run on
DEFENDER_TEAM_API_KEY: OZ Defender-specific
DEFENDER_TEAM_SECRET_KEY: OZ Defender-specific
AUTOTASK_ID: OZ Defender-specific
RELAYER_API_KEY: OZ Defender-specific
RELAYER_API_SECRET: OZ Defender-specific
JSON_RPC_URI: Network-specific
```

Once the config has been saved with all of those variables, the script will run.

If everything looks good, you can upload the task to OpenZeppelin Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```
yarn update
```
