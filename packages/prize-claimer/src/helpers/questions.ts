import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  FEE_RECIPIENT: string;
  MIN_PROFIT_THRESHOLD_USD: string;
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
  MIN_PROFIT_THRESHOLD_USD: {
    name: 'MIN_PROFIT_THRESHOLD_USD',
    type: 'input',
    filter: (input) => input.replace('$', ''),
    message: chalk.green(
      'How much profit would you like to make per transaction (in USD, default is 2.50):',
    ),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter the minimum profit per claim in USD (ie. 0.1 for $0.10):';
      }
    },
  },
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    extraConfig: {
      network: [PACKAGE_QUESTIONS.FEE_RECIPIENT, PACKAGE_QUESTIONS.MIN_PROFIT_THRESHOLD_USD],
    },
  });
};
