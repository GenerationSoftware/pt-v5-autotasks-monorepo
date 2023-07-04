import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  FEE_RECIPIENT: string;
}

const PACKAGE_QUESTIONS: { [key in keyof PACKAGE_CONFIG]: DistinctQuestion & { name: key } } = {
  FEE_RECIPIENT: {
    name: 'FEE_RECIPIENT',
    type: 'input',
    message: chalk.green(
      'Enter the fee recipient address (the account which will accumulate rewards/fee profit on the PrizePool):',
    ),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the fee recipient's address:";
      }
    },
  },
};

export const askQuestions = (config: Configstore, { askFlashbots }) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    askFlashbots,
    extraConfig: {
      network: [PACKAGE_QUESTIONS.FEE_RECIPIENT],
    },
  });
};
