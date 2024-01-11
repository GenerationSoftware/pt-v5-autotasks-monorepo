import {
  runFlashLiquidator,
  FlashLiquidatorConfig,
} from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (config: FlashLiquidatorConfig): Promise<void> => {
  try {
    await runFlashLiquidator(config);
  } catch (error) {
    throw new Error(error);
  }
};
