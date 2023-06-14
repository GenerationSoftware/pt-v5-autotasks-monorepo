import esMain from 'es-main';
import Configstore from 'configstore';

import { askChainId } from '@pooltogether/v5-autotasks-library';

import pkg from '../package.json';

if (esMain(import.meta)) {
  await askChainId(new Configstore(pkg.name));
}

export function main() {}
