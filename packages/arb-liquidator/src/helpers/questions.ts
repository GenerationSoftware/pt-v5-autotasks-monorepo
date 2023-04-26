import chalk from "chalk";
import inquirer from "inquirer";

import { getSharedQuestions, when } from "@pooltogether/v5-autotasks-library";

export const askQuestions = config => {
  const questions: any[] = getSharedQuestions(config);

  questions.push({
    name: "SWAP_RECIPIENT",
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
    name: "RELAYER_ADDRESS",
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
