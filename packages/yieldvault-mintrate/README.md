<p align="center">
  <img src="https://raw.githubusercontent.com/GenerationSoftware/pt-v5-utils-js/main/img/pooltogether-logo--purple@2x.png?raw=true" alt="PoolTogether Brand" style="max-width:100%;" width="300">
</p>

<br />

# 🤖 PoolTogether V5

### @generationsoftware/pt-v5-autotasks-yieldvault-mintrate

## TESTNET-ONLY

PoolTogether hyperstructure (v5) OpenZeppelin Defender autotask to touch the MintRate on each YieldVault (testnet only!)

## 🖥️ Usage

### 1. Setup

To run the OpenZeppelin Defender autotask locally or build for OpenZeppelin Defender, first set up your environment variables using `dotenv`:

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
JSON_RPC_URI: Your Infura/Alchemy/etc JSON RPC URI

### THIS:

CUSTOM_RELAYER_PRIVATE_KEY: run liquidations using your own EOA

### OR THIS (recommended):

DEFENDER_TEAM_API_KEY: OZ Defender Team API Key
DEFENDER_TEAM_API_SECRET: OZ Defender Team Secret Key
AUTOTASK_ID: OZ Defender, the ID of the autotask (can get from browser URL bar)
RELAYER_API_KEY: OZ Defender chain Relayer API Key
RELAYER_API_SECRET: OZ Defender chain Relayer API Secret

```

### 2. Start liquidating

When everything is set and the env vars have been exported you can run the bot locally:

```sh
yarn start
```

### 3. Update remote autotask

With the config in place from step 1, you can build and update the autotask on OpenZeppelin Defender using:

```sh
yarn update
```
