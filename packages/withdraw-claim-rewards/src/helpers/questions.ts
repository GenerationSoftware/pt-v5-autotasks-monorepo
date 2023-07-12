import chalk from 'chalk';
import inquirer, { DistinctQuestion } from 'inquirer';

import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  REWARDS_RECIPIENT: string;
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
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    extraConfig: {
      network: [PACKAGE_QUESTIONS.REWARDS_RECIPIENT],
    },
  });
};
