import inquirer from "inquirer";

import {
  SHARED_CONFIG_KEYS,
  checkConfig,
  getSharedQuestions
} from "@pooltogether/v5-autotasks-library";

export const checkPackageConfig = config => {
  checkConfig(config, SHARED_CONFIG_KEYS);
};

export const askQuestions = (config, { askFlashbots }) => {
  const questions: any[] = getSharedQuestions(config, askFlashbots);

  return inquirer.prompt(questions);
};
