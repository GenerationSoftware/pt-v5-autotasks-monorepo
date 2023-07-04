import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  SWAP_RECIPIENT: string;
}

const PACKAGE_QUESTIONS: { [key in keyof PACKAGE_CONFIG]: DistinctQuestion & { name: key } } = {
  SWAP_RECIPIENT: {
    name: 'SWAP_RECIPIENT',
    type: 'input',
    message: chalk.green('Enter the swap recipient address:'),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the swap recipient's address (where the profit should be sent):";
      }
    },
  },
};

export const askQuestions = (config: Configstore, { askFlashbots }) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    askFlashbots,
    extraConfig: {
      network: [PACKAGE_QUESTIONS.SWAP_RECIPIENT],
    },
  });
};
