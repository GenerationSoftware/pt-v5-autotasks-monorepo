import chalk from "chalk";
import inquirer from "inquirer";

import { getSharedQuestions, when } from "@pooltogether/v5-autotasks-library";

export const askQuestions = config => {
  const questions: any[] = getSharedQuestions(config);

  questions.push({
    name: "FEE_RECIPIENT",
    type: "input",
    message: chalk.green("Enter the fee recipient address:"),
    when,
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the fee recipient's address (where the fee profit should be sent):";
      }
    }
  });

  return inquirer.prompt(questions);
};
