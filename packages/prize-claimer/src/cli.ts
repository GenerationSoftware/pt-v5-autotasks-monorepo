import esMain from "es-main";

import figlet from "figlet";
import chalk from "chalk";
import Configstore from "configstore";
import inquirer from "inquirer";

import { handler } from "./handler";
import pkg from "../package.json";

const config = new Configstore(pkg.name);

const CHAIN_IDS = { goerli: 5, mainnet: 1 };

console.clear();
console.log(chalk.magenta(figlet.textSync("PoolTogether")));
console.log(chalk.blue(figlet.textSync("Prize Claim Bot")));

if (esMain(import.meta)) {
  const answers = await inquire();
  console.log(answers);
  if (!answers.existingConfig) {
    delete answers.age;
    config.set(answers);
  }
  console.log(config.size);
  console.log(config.all);

  // const { RELAYER_API_KEY, RELAYER_API_SECRET } = process.env;
  // handler({
  //   apiKey: RELAYER_API_KEY,
  //   apiSecret: RELAYER_API_SECRET,
  // })
  //   .then(() => process.exit(0))
  //   .catch((error) => {
  //     console.error(error);
  //     process.exit(1);
  //   });
}

export function main() {}
// getStoredGithubToken: () => {
//   return conf.get("github.token");
// },
function when(answers) {
  if (!answers.existingConfig) {
    return true;
  }
}

function inquire() {
  const questions = [
    {
      name: "existingConfig",
      type: "list",
      message:
        "Use existing config? (~/.config/configstore/@pooltogether/v5-autotasks-prize-claimer.json):",
      choices: ["Yes", "No"],
      filter(val) {
        return val === "Yes" ? true : false;
      },
    },
    {
      name: "DEFENDER_TEAM_API_KEY",
      type: "input",
      message: "Enter your OpenZeppelin Defender Team API Key:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team API Key.";
        }
      },
    },
    {
      name: "DEFENDER_TEAM_SECRET_KEY",
      type: "input",
      message: "Enter your OpenZeppelin Defender Team Secret Key:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Team Secret Key.";
        }
      },
    },
    {
      name: "AUTOTASK_ID",
      type: "input",
      message: "Enter your OpenZeppelin Defender Autotask ID:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Autotask ID.";
        }
      },
    },
    {
      name: "RELAYER_API_KEY",
      type: "input",
      message: "Enter your OpenZeppelin Defender Relayer API Key:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Relayer API Key.";
        }
      },
    },
    {
      name: "RELAYER_API_SECRET",
      type: "input",
      message: "Enter your OpenZeppelin Defender Relayer API Secret:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your OpenZeppelin Defender Relayer API Secret.";
        }
      },
    },
    {
      name: "INFURA_API_KEY",
      type: "input",
      message: "Enter your Infura API Key:",
      when,
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your Infura API Key.";
        }
      },
    },
    {
      name: "CHAIN_ID",
      type: "list",
      message: "Which network?",
      choices: ["Goerli", "Mainnet"],
      when,
      filter(val) {
        return CHAIN_IDS[val.toLowerCase()];
      },
    },
  ];
  return inquirer.prompt(questions);
}
