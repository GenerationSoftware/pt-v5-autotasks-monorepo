import chalk from "chalk";

import { CHAIN_IDS } from "./network";
import Configstore from "configstore";
import { DistinctQuestion } from "inquirer";
import inquirer from "inquirer";

export type CHAIN_CONFIG = {
  CHAIN_ID: number; // stores last-selected chain ID
};

export type GLOBAL_CONFIG = {
  DEFENDER_TEAM_API_KEY: string;
  DEFENDER_TEAM_SECRET_KEY: string;
};

export type NETWORK_CONFIG = {
  AUTOTASK_ID: string;
  RELAYER_API_KEY: string;
  RELAYER_API_SECRET: string;
  JSON_RPC_URI: string;
  USE_FLASHBOTS: boolean;
};

const GLOBAL_CONFIG_QUESTIONS: { [key in keyof GLOBAL_CONFIG]: DistinctQuestion & { name: key } } =
  {
    DEFENDER_TEAM_API_KEY: {
      name: "DEFENDER_TEAM_API_KEY",
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Team API Key:"),
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team API Key.";
        }
      },
    },
    DEFENDER_TEAM_SECRET_KEY: {
      name: "DEFENDER_TEAM_SECRET_KEY",
      type: "password",
      message: chalk.green("Enter your OpenZeppelin Defender Team Secret Key:"),
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team Secret Key.";
        }
      },
    },
  };

/* These will be prefixed in the config with `${CHAIN_ID}.` before the key name. */
export const NETWORK_CONFIG_QUESTIONS: {
  [key in keyof NETWORK_CONFIG]: DistinctQuestion & { name: key };
} = {
  AUTOTASK_ID: {
    name: "AUTOTASK_ID",
    type: "input",
    message: chalk.green("Enter your OpenZeppelin Defender Autotask ID:"),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your OpenZeppelin Defender Autotask ID.";
      }
    },
  },
  RELAYER_API_KEY: {
    name: "RELAYER_API_KEY",
    type: "password",
    message: chalk.green("Enter your OpenZeppelin Defender Relayer API Key:"),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your OpenZeppelin Defender Relayer API Key.";
      }
    },
  },
  RELAYER_API_SECRET: {
    name: "RELAYER_API_SECRET",
    type: "password",
    message: chalk.green("Enter your OpenZeppelin Defender Relayer API Secret:"),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your OpenZeppelin Defender Relayer API Secret.";
      }
    },
  },
  JSON_RPC_URI: {
    name: "JSON_RPC_URI",
    type: "password",
    message: chalk.green("Enter your JSON RPC URI:"),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter your JSON RPC URI.";
      }
    },
  },
  USE_FLASHBOTS: {
    name: "USE_FLASHBOTS",
    type: "list",
    message: chalk.green(
      "Use Flashbots to keep transactions private from the mempool and reduce failures? (recommended)"
    ),
    choices: ["Yes", "No"],
    filter(val) {
      return val === "Yes" ? true : false;
    },
  },
};

export const configHasKeys = (config: Configstore | Record<string, any>, keys: string[]) => {
  for (const configKey of keys) {
    if (config instanceof Configstore) {
      if (!config.has(configKey)) return false;
    } else {
      if (!(configKey in config)) return false;
    }
  }
  return true;
};

/**
 * populateConfig
 *
 * Asks global & network configuration questions, saves the results to
 * a configstore, and returns the current config in flattened format
 * (network config at root level with global config).
 */
export const populateConfig = async <
  G extends Record<string, any> = {},
  N extends Record<string, any> = {}
>(
  config: Configstore,
  {
    askFlashbots,
    extraConfig,
  }: {
    askFlashbots?: boolean;
    extraConfig?: {
      global?: DistinctQuestion[];
      network?: DistinctQuestion[];
    };
  } = {
    askFlashbots: true,
  }
): Promise<CHAIN_CONFIG & GLOBAL_CONFIG & NETWORK_CONFIG & G & N> => {
  const globalQuestions = [
    ...Object.values(GLOBAL_CONFIG_QUESTIONS),
    ...(extraConfig?.global ?? []),
  ];
  const networkQuestions = [
    ...Object.values(NETWORK_CONFIG_QUESTIONS),
    ...(extraConfig?.network ?? []),
  ];
  const globalKeys = globalQuestions.map((x) => x.name);
  const networkKeys = networkQuestions.map((x) => x.name);
  let globalAnswers = {};
  let networkAnswers = {};

  // Ask for chain info:
  const previousNetwork = config.has("CHAIN_ID") ? config.get("CHAIN_ID") : null;
  const previousNetworkName = previousNetwork
    ? Object.fromEntries(Object.entries(CHAIN_IDS).map(([name, id]) => [id, name]))[previousNetwork]
    : null;
  const { CHAIN_ID } = await inquirer.prompt({
    name: "CHAIN_ID",
    type: "list",
    message: chalk.green("Which network?"),
    choices: [
      ...(previousNetworkName ? [`Last Used (${previousNetworkName})`] : []),
      "Mumbai",
      "Goerli",
      "Sepolia",
      "Mainnet",
    ],
    filter(val: string) {
      if (val.startsWith("Last Used")) val = previousNetworkName;
      return CHAIN_IDS[val.toLowerCase()];
    },
  });
  config.set("CHAIN_ID", CHAIN_ID);

  // Check for global config:
  let useExistingGlobal = false;
  if (configHasKeys(config, globalKeys)) {
    const { USE_GLOBAL_CONFIG } = await inquirer.prompt({
      name: "USE_GLOBAL_CONFIG",
      type: "list",
      message: chalk.green(
        `Would you like to use the existing OZ Defender config? (${config.path})`
      ),
      choices: ["Yes", "No"],
      filter(val: string) {
        return val.toLowerCase().startsWith("y");
      },
    });
    useExistingGlobal = USE_GLOBAL_CONFIG;
  }

  // Ask global questions:
  if (!useExistingGlobal) {
    globalAnswers = await inquirer.prompt(globalQuestions);
  } else {
    globalAnswers = Object.fromEntries(
      Object.entries(config.all).filter(([key]) => globalKeys.includes(key))
    );
  }

  // Check for network config:
  let useExistingNetwork = false;
  if (`${CHAIN_ID}` in config.all && configHasKeys(config.all[CHAIN_ID], networkKeys)) {
    const { USE_NETWORK_CONFIG } = await inquirer.prompt({
      name: "USE_NETWORK_CONFIG",
      type: "list",
      message: chalk.green(`Would you like to use the existing network config? (${config.path})`),
      choices: ["Yes", "No"],
      filter(val: string) {
        return val.toLowerCase().startsWith("y");
      },
    });
    useExistingNetwork = USE_NETWORK_CONFIG;
  }

  // Ask network questions:
  if (!useExistingNetwork) {
    networkAnswers = await inquirer.prompt(networkQuestions);
  } else {
    networkAnswers = Object.fromEntries(
      Object.entries(config.all[CHAIN_ID]).filter(([key]) => networkKeys.includes(key))
    );
  }

  // Set config:
  let flattenedConfig = { CHAIN_ID };
  for (const [key, value] of Object.entries(globalAnswers)) {
    config.set(key, value);
    flattenedConfig[key] = value;
  }
  for (const [key, value] of Object.entries(networkAnswers)) {
    config.set(`${CHAIN_ID}.${key}`, value);
    flattenedConfig[key] = value;
  }

  // Return flattened config:
  return flattenedConfig as any;
};
