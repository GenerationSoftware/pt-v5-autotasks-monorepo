import chalk from 'chalk';
import { DistinctQuestion } from 'inquirer';

import { camelize, CHAIN_IDS, populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

interface RELAY_CONFIG {
  RELAY_CHAIN_ID: number;
  RELAY_RELAYER_API_KEY: string;
  RELAY_RELAYER_API_SECRET: string;
  RELAY_JSON_RPC_URI: string;
}

interface PACKAGE_CONFIG {
  REWARD_RECIPIENT: string;
  MIN_PROFIT_THRESHOLD_USD: string;
}

const PACKAGE_QUESTIONS: { [key in keyof PACKAGE_CONFIG]: DistinctQuestion & { name: key } } = {
  REWARD_RECIPIENT: {
    name: 'REWARD_RECIPIENT',
    type: 'input',
    message: chalk.green(
      'Enter the reward recipient address (the account which will receive the rewards profit):',
    ),
    validate: function(value) {
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
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter the minimum profit per transaction in USD (ie. 0.2 for $0.20):';
      }
    },
  },
};

export const RELAY_QUESTIONS: { [key in keyof RELAY_CONFIG]: DistinctQuestion & { name: key } } = {
  RELAY_CHAIN_ID: {
    name: 'RELAY_CHAIN_ID',
    type: 'list',
    message: chalk.green('Which network to add L2 relayer config for?'),
    choices: [
      '(1)        Mainnet',
      '(10)       Optimism',
      '(42161)    Arbitrum',
      '(421613)   Arbitrum Goerli',
      '(5)        Goerli',
      '(11155111) Sepolia',
      '(420)      Optimism Goerli',
    ],
    filter(val: string) {
      return CHAIN_IDS[camelize(val.match(/([^\)]+$)/)[0].trim())];
    },
  },
  RELAY_RELAYER_API_KEY: {
    name: 'RELAY_RELAYER_API_KEY',
    type: 'password',
    message: chalk.green(`Enter this relay chain's OZ Defender Relayer API key:`),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the new relay chain's OZ Defender Relayer API key:";
      }
    },
  },
  RELAY_RELAYER_API_SECRET: {
    name: 'RELAY_RELAYER_API_SECRET',
    type: 'password',
    message: chalk.green(`Enter this relay chain's OZ Defender Relayer API secret:`),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the new relay chain's OZ Defender Relayer API secret:";
      }
    },
  },
  RELAY_JSON_RPC_URI: {
    name: 'RELAY_JSON_RPC_URI',
    type: 'password',
    message: chalk.green(`Enter this relay chain's JSON RPC read provider URI:`),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return "Please enter the new relay chain's JSON RPC read provider URI:";
      }
    },
  },
};

export const askQuestions = (config: Configstore) => {
  return populateConfig<{}, PACKAGE_CONFIG | RELAY_CONFIG>(config, {
    extraConfig: {
      network: [PACKAGE_QUESTIONS.REWARD_RECIPIENT, PACKAGE_QUESTIONS.MIN_PROFIT_THRESHOLD_USD],
      relay: [
        RELAY_QUESTIONS.RELAY_CHAIN_ID,
        RELAY_QUESTIONS.RELAY_RELAYER_API_KEY,
        RELAY_QUESTIONS.RELAY_RELAYER_API_SECRET,
        RELAY_QUESTIONS.RELAY_JSON_RPC_URI,
      ],
    },
  });
};
