import esMain from 'es-main';
import Configstore from 'configstore';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { askChainId, CHAIN_IDS } from '@pooltogether/v5-autotasks-library';

import pkg from '../package.json';

console.clear();

if (esMain(import.meta)) {
  await askChainId(new Configstore(pkg.name));
}

export function main() {}
