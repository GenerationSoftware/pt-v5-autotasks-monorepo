import chalk from "chalk";

import { CHAIN_IDS } from "./network";

export const when = answers => {
  if (!answers.existingConfig) {
    return true;
  }
};

// TODO: Don't store CHAIN_ID in config but make it an arg value for each run
export const SHARED_CONFIG_KEYS = {
  DEFENDER_TEAM_API_KEY: "DEFENDER_TEAM_API_KEY",
  DEFENDER_TEAM_SECRET_KEY: "DEFENDER_TEAM_SECRET_KEY",
  AUTOTASK_ID: "AUTOTASK_ID",
  RELAYER_API_KEY: "RELAYER_API_KEY",
  RELAYER_API_SECRET: "RELAYER_API_SECRET",
  INFURA_API_KEY: "INFURA_API_KEY",
  FLASHBOTS_AUTH_PRIVATE_KEY: "FLASHBOTS_AUTH_PRIVATE_KEY",
  CHAIN_ID: "CHAIN_ID"
};

export const checkConfig = (config, keys) => {
  for (const configKey of Object.keys(keys)) {
    if (!config.has(configKey)) {
      console.warn(chalk.yellow.bold(`'${configKey}' should be defined in your config`));
    }
  }

  for (const param of Object.entries(config.get())) {
    const key = param[0];
    const value = param[1];
    if (!value) {
      console.warn(chalk.yellow.bold(`'${key}' is missing from your config`));
    }
  }
};

export const getSharedQuestions = config => {
  return [
    {
      name: "existingConfig",
      type: "list",
      message: chalk.magenta.bold(`Use existing config? (${config._path}):`),
      choices: ["Yes", "No"],
      when: config.has("DEFENDER_TEAM_API_KEY"),
      filter(val) {
        return val === "Yes" ? true : false;
      }
    },
    {
      name: SHARED_CONFIG_KEYS.DEFENDER_TEAM_API_KEY,
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Team API Key:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team API Key.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.DEFENDER_TEAM_SECRET_KEY,
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Team Secret Key:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team Secret Key.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.AUTOTASK_ID,
      type: "input",
      message: chalk.green("Enter your OpenZeppelin Defender Autotask ID:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Autotask ID.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.RELAYER_API_KEY,
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Relayer API Key:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Relayer API Key.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.RELAYER_API_SECRET,
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Relayer API Secret:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Relayer API Secret.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.INFURA_API_KEY,
      type: "password",
      message: chalk.green("Enter your Infura API Key:"),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your Infura API Key.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.FLASHBOTS_AUTH_PRIVATE_KEY,
      type: "password",
      message: chalk.green(
        "Any wallet private key will work (this is to build reputation with Flashbots over time):"
      ),
      when,
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your Flashbots Wallet Private Key.";
        }
      }
    },
    {
      name: SHARED_CONFIG_KEYS.CHAIN_ID,
      type: "list",
      message: chalk.green("Which network?"),
      choices: ["Goerli", "Mainnet"],
      when,
      filter(val) {
        return CHAIN_IDS[val.toLowerCase()];
      }
    }
  ];
};
