# @pooltogether/v5-autotasks-library

PoolTogether hyperstructure (v5) supporting functions for the bots.

## Install

```
yarn add @pooltogether/v5-autotasks-library
```

or

```
npm install @pooltogether/v5-autotasks-library
```

## Usage

You can use this library in your own code, for instance if you would rather not use OpenZeppelin Defender for your automated/cron-based bots. Here's an example:

```ts
import {
  testnetContractsBlob as contracts,
  getClaimerProfitablePrizeTxs,
} from "@pooltogether/v5-autotasks-library";

const populatedTxs = getClaimerProfitablePrizeTxs(
  contracts: ContractsBlob,
  readProvider: Provider,
  config: GetClaimerProfitablePrizeTxsParams
)
```

Where `readProvider` is any ethers `Provider`, and `params` is of the `GetClaimerProfitablePrizeTxsParams` type. You can then pass the list of populated transactions `populatedTxs` to whichever relayer/write provider you would like to send transactions with.
