import chalk from 'chalk';
import Configstore from 'configstore';
import inquirer, { DistinctQuestion } from 'inquirer';

import { CHAINS_BY_ID } from './network';

let relayQuestionsClone: DistinctQuestion[] = [];
export async function startManageRelays(
  CHAIN_ID: number,
  config: Configstore,
  relayQuestions,
): Promise<void> {
  relayQuestionsClone = [...relayQuestions];
  await relayManagementLoop(CHAIN_ID, config);
}

/**
 * Show the relay management menu
 */
const addChoice = 'Add new L2 relay config';
const removeChoice = 'Remove L2 relay';
const showChoice = 'Show all relays';
const continueChoice = 'Continue';
async function relayManagementLoop(CHAIN_ID: number, config: Configstore): Promise<void> {
  const relayMenuQuestions = [
    {
      type: 'list',
      name: 'MENU_OPTION',
      message: chalk.blue('Relay management'),
      choices: [addChoice, removeChoice, showChoice, continueChoice],
    },
  ];
  const answer = await inquirer.prompt(relayMenuQuestions);

  switch (answer.MENU_OPTION) {
    case addChoice:
      await mainAddRelay(CHAIN_ID, config);
      break;
    case removeChoice:
      await mainRemoveRelay(CHAIN_ID, config);
      break;
    case showChoice:
      await mainShowRelays(CHAIN_ID, config);
      break;
    case continueChoice:
      console.log(chalk.green.bold('Relay L2s saved, continuing bot execution ...'));
      break;
  }
}

async function mainAddRelay(CHAIN_ID: number, config: Configstore) {
  const addRelayAnswers = await inquirer.prompt(relayQuestionsClone);
  console.log(
    chalk.yellow(
      'Ok, will add L2 Relay config for network with chain ID:',
      addRelayAnswers['RELAY_CHAIN_ID'],
    ),
  );

  setRelay(CHAIN_ID, config, addRelayAnswers);

  await relayManagementLoop(CHAIN_ID, config);
}

// TODO: What if no relays exist?
async function mainRemoveRelay(CHAIN_ID: number, config: Configstore) {
  const existingRelayKeys = Object.keys(config.get(`${CHAIN_ID}.RELAYS`));
  if (existingRelayKeys.length === 0) {
    console.log(chalk.red('No L2 relay configs exist yet to remove.'));
    return await relayManagementLoop(CHAIN_ID, config);
  }

  let choices = [];
  for (const value of existingRelayKeys) {
    choices.push(CHAINS_BY_ID[Number(value)]);
  }

  const { removeRelayChainName } = await inquirer.prompt({
    name: 'removeRelayChainName',
    type: 'list',
    message: chalk.green('Which L2 relay config you would like to remove?'),
    choices,
  });

  deleteRelay(CHAIN_ID, config, removeRelayChainName);

  await relayManagementLoop(CHAIN_ID, config);
}

async function mainShowRelays(CHAIN_ID: number, config: Configstore) {
  console.log(chalk.yellow('L2 Relay Configs exist for the following chains:'));

  showRelays(CHAIN_ID, config);

  await relayManagementLoop(CHAIN_ID, config);
}

export const migrateOldRelayEntry = (CHAIN_ID: number, config: Configstore) => {
  const oldRelay = {
    RELAY_CHAIN_ID: config.get(`${CHAIN_ID}.RELAY_CHAIN_ID`),
    RELAY_RELAYER_API_KEY: config.get(`${CHAIN_ID}.RELAY_RELAYER_API_KEY`),
    RELAY_RELAYER_API_SECRET: config.get(`${CHAIN_ID}.RELAY_RELAYER_API_SECRET`),
    RELAY_JSON_RPC_URI: config.get(`${CHAIN_ID}.RELAY_JSON_RPC_URI`),
  };

  if (oldRelay['RELAY_RELAYER_API_KEY']?.length > 0) {
    setRelay(CHAIN_ID, config, oldRelay);

    config.delete(`${CHAIN_ID}.RELAY_CHAIN_ID`);
    config.delete(`${CHAIN_ID}.RELAY_RELAYER_API_KEY`);
    config.delete(`${CHAIN_ID}.RELAY_RELAYER_API_SECRET`);
    config.delete(`${CHAIN_ID}.RELAY_JSON_RPC_URI`);
  }
};

const setRelay = (CHAIN_ID: number, config: Configstore, newRelay) => {
  config.set(`${CHAIN_ID}.RELAYS.${newRelay.RELAY_CHAIN_ID}`, newRelay);
};

const showRelays = (CHAIN_ID: number, config: Configstore) => {
  const relays = config.get(`${CHAIN_ID}.RELAYS`);

  const existingRelayKeys = Object.keys(relays);
  if (existingRelayKeys.length === 0) {
    console.log(chalk.red('No L2 relay configs exist yet.'));
    return;
  }

  for (const key of Object.keys(relays)) {
    console.log(chalk.dim(CHAINS_BY_ID[Number(key)]));
  }
};

const deleteRelay = (CHAIN_ID: number, config: Configstore, removeRelayChainName: string) => {
  const chainId = removeRelayChainName.match(/^(\d+)/)[0].trim(); // Numbers from start of chain name string
  config.delete(`${CHAIN_ID}.RELAYS.${chainId}`);
  console.log(chalk.green(`Removed L2 relay config for chain: ${removeRelayChainName}`));
};
