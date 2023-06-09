# @pooltogether/v5-autotasks-draw-reserve

![title image for PoolTogether Draw Reserve Sweeper Bot](https://github.com/pooltogether/v5-autotasks/raw/main/packages/draw-reserve/prize-claim-img.png "title image for PoolTogether Draw Reserve Sweeper Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to sweep any rewards a draw start & complete bot has accumulated on the prize pool.

## Usage

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

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

The following one is unique to the draw reserve bot:

```
RESERVE_RECIPIENT: EVM account that will receive the claim reserve
```

Once the config has been saved with all of those variables, the script will run `withdrawReserve()` and attempt to send a transaction.

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can update the autotask on OZ Defender using:

```
yarn update
```
