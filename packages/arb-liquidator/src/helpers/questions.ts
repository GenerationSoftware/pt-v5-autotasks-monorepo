import chalk from "chalk";
import inquirer from "inquirer";

import {
  SHARED_CONFIG_KEYS,
  checkConfig,
  getSharedQuestions,
  when
} from "@pooltogether/v5-autotasks-library";

const PACKAGE_CONFIG_KEYS = {
  SWAP_RECIPIENT: "SWAP_RECIPIENT",
  RELAYER_ADDRESS: "RELAYER_ADDRESS"
};

export const checkPackageConfig = config => {
  checkConfig(config, SHARED_CONFIG_KEYS);
  checkConfig(config, PACKAGE_CONFIG_KEYS);
};

export const askQuestions = (config, { askFlashbots }) => {
  const questions: any[] = getSharedQuestions(config, askFlashbots);

  questions.push({
    name: PACKAGE_CONFIG_KEYS.SWAP_RECIPIENT,
    type: "input",
    message: chalk.green("Enter the swap recipient address:"),
    when,
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the swap recipient's address (where the profit should be sent):";
      }
    }
  });

  questions.push({
    name: PACKAGE_CONFIG_KEYS.RELAYER_ADDRESS,
    type: "input",
    message: chalk.green("Enter the relayer address:"),
    when,
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the relayer address (account address which is sending the transactions):";
      }
    }
  });

  return inquirer.prompt(questions);
};
