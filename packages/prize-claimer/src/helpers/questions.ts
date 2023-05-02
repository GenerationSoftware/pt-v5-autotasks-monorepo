import chalk from "chalk";
import inquirer from "inquirer";

import {
  SHARED_CONFIG_KEYS,
  checkConfig,
  getSharedQuestions,
  when
} from "@pooltogether/v5-autotasks-library";

const PACKAGE_CONFIG_KEYS = {
  FEE_RECIPIENT: "FEE_RECIPIENT"
};

export const checkPackageConfig = config => {
  checkConfig(config, SHARED_CONFIG_KEYS);
  checkConfig(config, PACKAGE_CONFIG_KEYS);
};

export const askQuestions = (config, { askFlashbots }) => {
  const questions: any[] = getSharedQuestions(config, askFlashbots);

  questions.push({
    name: PACKAGE_CONFIG_KEYS.FEE_RECIPIENT,
    type: "input",
    message: chalk.green(
      "Enter the fee recipient address (the account which will accumulate rewards/fee profit on the PrizePool):"
    ),
    when,
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the fee recipient's address:";
      }
    }
  });

  return inquirer.prompt(questions);
};
