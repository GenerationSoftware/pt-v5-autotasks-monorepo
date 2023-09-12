import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  REWARDS_RECIPIENT: string;
  MIN_PROFIT_THRESHOLD_USD: string;
}

const PACKAGE_QUESTIONS: { [key in keyof PACKAGE_CONFIG]: DistinctQuestion & { name: key } } = {
  REWARDS_RECIPIENT: {
    name: 'REWARDS_RECIPIENT',
    type: 'input',
    message: chalk.green('Enter the rewards recipient address:'),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the rewards recipient's address (where the rewards should be sent):";
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
        return 'Please enter the minimum profit in USD (ie. 20 for $20.00):';
      }
    },
  },
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    extraConfig: {
      network: [PACKAGE_QUESTIONS.REWARDS_RECIPIENT, PACKAGE_QUESTIONS.MIN_PROFIT_THRESHOLD_USD],
    },
  });
};
