# @pooltogether/v5-autotasks-prize-claimer

![title image for PoolTogether Prize Claimer Bot](https://github.com/pooltogether/v5-autotasks/raw/main/packages/prize-claimer/prize-claim-img.png "title image for PoolTogether Prize Claimer Bot")

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to claim prizes on behalf of depositors.

## Development

This package uses `yalc` locally to connect the library package (in **[/packages/library](../library)**) to this one. This let's us use `import * from '@pooltogether/v5-autotasks-library` without needing to publish to npm on each change.

Typically you will want to run `yarn start` or `npm run start` in the **[library package](../library)** first and make sure it compiles and publishes to yalc. Then you can run `yarn start` or `npm run start` in this package in another terminal tab to run the bot.

## Usage

This package is both a CLI for setting the config parameters of the OpenZeppelin job and a build task for compiling the `handler()` prior to deploy on OZ Defender.

The bulk of determining if a claim is profitable is in the **[/packages/library/src/claimerProfitablePrizeTxs.ts#L58](../library)**.

Typically this would be paired with the withdraw-claim-rewards bot in this monorepo, which will periodically sweep rewards profit to an EVM account.

## Note:

If you would rather use something other than OZ Defender/Infura, you can import the `v5-autotasks-library` into your own code. More info here: **[v5-autotasks-library](../library#usage)**

### 1. Run autotask

To run the OpenZeppelin Defender autotask locally:

```
yarn start
```

You will be prompted to fill in the following necessary variables:

```
DEFENDER_TEAM_API_KEY: OZ Defender-specific
DEFENDER_TEAM_SECRET_KEY: OZ Defender-specific
AUTOTASK_ID: OZ Defender-specific
RELAYER_API_KEY: OZ Defender-specific
RELAYER_API_SECRET: OZ Defender-specific
INFURA_API_KEY: Infura-specific
CHAIN_ID: Which network to claim on
```

The following one is unique to the prize claimer bot:

```
FEE_RECIPIENT: Who will receive the profit for claiming on other's behalf
```

Once the config has been saved with all of those variables, the script will run `getClaimerProfitablePrizeTxs()` and attempt to send multicall batched transactions through Flashbots bundles.

If everything looks good, you can upload the task to OZ Defender to be run periodically.

### 2. Update autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```
yarn update
```
