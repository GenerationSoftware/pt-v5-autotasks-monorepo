import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { camelize, CHAIN_IDS, populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface PACKAGE_CONFIG {
  RELAY_CHAIN_ID: number;
  RELAY_RELAYER_API_KEY: string;
  RELAY_RELAYER_API_SECRET: string;
  RELAY_JSON_RPC_URI: string;
  REWARD_RECIPIENT: string;
  MIN_PROFIT_THRESHOLD_USD: string;
}

const PACKAGE_QUESTIONS: { [key in keyof PACKAGE_CONFIG]: DistinctQuestion & { name: key } } = {
  RELAY_CHAIN_ID: {
    name: 'RELAY_CHAIN_ID',
    type: 'list',
    message: chalk.green('Which network are the RngRelayAuction and PrizePool contracts on?'),
    choices: ['Mainnet', 'Optimism', 'Goerli', 'Sepolia', 'Optimism Goerli'],
    filter(val: string) {
      return CHAIN_IDS[camelize(val)];
    },
  },
  RELAY_RELAYER_API_KEY: {
    name: 'RELAY_RELAYER_API_KEY',
    type: 'password',
    message: chalk.green(`Enter the relay chain's OZ Defender Relayer API key:`),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the relay chain's OZ Defender Relayer API key:";
      }
    },
  },
  RELAY_RELAYER_API_SECRET: {
    name: 'RELAY_RELAYER_API_SECRET',
    type: 'password',
    message: chalk.green(`Enter the relay chain's OZ Defender Relayer API secret:`),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the relay chain's OZ Defender Relayer API secret:";
      }
    },
  },
  RELAY_JSON_RPC_URI: {
    name: 'RELAY_JSON_RPC_URI',
    type: 'password',
    message: chalk.green(`Enter the relay chain's JSON RPC read provider URI:`),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the relay chain's JSON RPC read provider URI:";
      }
    },
  },
  REWARD_RECIPIENT: {
    name: 'REWARD_RECIPIENT',
    type: 'input',
    message: chalk.green(
      'Enter the reward recipient address (the account which will receive the rewards profit):',
    ),
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the reward recipient's address:";
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
        return 'Please enter the minimum profit per transaction in USD (ie. 0.2 for $0.20):';
      }
    },
  },
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG>(config, {
    extraConfig: {
      network: [
        PACKAGE_QUESTIONS.RELAY_CHAIN_ID,
        PACKAGE_QUESTIONS.RELAY_RELAYER_API_KEY,
        PACKAGE_QUESTIONS.RELAY_RELAYER_API_SECRET,
        PACKAGE_QUESTIONS.RELAY_JSON_RPC_URI,
        PACKAGE_QUESTIONS.REWARD_RECIPIENT,
        PACKAGE_QUESTIONS.MIN_PROFIT_THRESHOLD_USD,
      ],
    },
  });
};
