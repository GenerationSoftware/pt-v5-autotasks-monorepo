import chalk from "chalk";

import { CHAIN_IDS } from "./network";

export const when = answers => {
  if (!answers.existingConfig) {
    return true;
  }
};

export const getSharedQuestions = config => {
  return [
    {
      name: "existingConfig",
      type: "list",
      message: chalk.magenta.bold(
        "Use existing config? (~/.config/configstore/@pooltogether/v5-autotasks-prize-claimer.json):"
      ),
      choices: ["Yes", "No"],
      when: config.has("DEFENDER_TEAM_API_KEY"),
      filter(val) {
        return val === "Yes" ? true : false;
      }
    },
    {
      name: "DEFENDER_TEAM_API_KEY",
      type: "input",
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
      name: "DEFENDER_TEAM_SECRET_KEY",
      type: "input",
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
      name: "AUTOTASK_ID",
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
      name: "RELAYER_API_KEY",
      type: "input",
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
      name: "RELAYER_API_SECRET",
      type: "input",
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
      name: "INFURA_API_KEY",
      type: "input",
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
      name: "CHAIN_ID",
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
