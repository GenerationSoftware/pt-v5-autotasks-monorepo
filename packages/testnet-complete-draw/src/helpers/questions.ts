import {
  populateConfig
} from "@pooltogether/v5-autotasks-library";
import Configstore from "configstore";

export const askQuestions = (config: Configstore, { askFlashbots }) => {
  return populateConfig(config, { askFlashbots });
};
