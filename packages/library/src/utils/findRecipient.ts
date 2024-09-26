import chalk from 'chalk';
import { AutotaskConfig } from '../types';

type ExtendedConfig = AutotaskConfig & {
  rewardRecipient?: string;
  swapRecipient?: string;
};

export const findRecipient = (config: ExtendedConfig): string => {
  if (!config.swapRecipient && !config.rewardRecipient) {
    const message = `Config - SWAP_RECIPIENT (Liquidator) or REWARD_RECIPIENT (DrawAuction, PrizeClaimer) not provided, setting recipient to relayer address:`;
    console.log(chalk.dim(message), chalk.yellowBright(config.relayerAddress));
    return config.relayerAddress;
  } else if (config.swapRecipient) {
    console.log(chalk.dim(`Config - SWAP_RECIPIENT:`), chalk.yellowBright(config.swapRecipient));
    return config.swapRecipient;
  } else {
    console.log(
      chalk.dim(`Config - REWARD_RECIPIENT:`),
      chalk.yellowBright(config.rewardRecipient),
    );
    return config.rewardRecipient;
  }
};
