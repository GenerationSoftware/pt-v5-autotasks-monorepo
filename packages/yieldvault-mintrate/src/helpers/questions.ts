import { populateConfig } from '@generationsoftware/pt-v5-autotasks-library';
import Configstore from 'configstore';

export const askQuestions = (config: Configstore) => {
  return populateConfig(config);
};
