import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  SWAP_RECIPIENT: string;
  MIN_PROFIT_THRESHOLD_USD: string;
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
  MIN_PROFIT_THRESHOLD_USD: {
    name: 'MIN_PROFIT_THRESHOLD_USD',
    type: 'input',
    filter: (input) => input.replace('$', ''),
    message: chalk.green(
      'How much profit would you like to make per transaction (in USD, default is 1.50):',
    ),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter the minimum profit threshold in USD:';
      }
    },
  },
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    extraConfig: {
      network: [PACKAGE_QUESTIONS.SWAP_RECIPIENT, PACKAGE_QUESTIONS.MIN_PROFIT_THRESHOLD_USD],
    },
  });
};
