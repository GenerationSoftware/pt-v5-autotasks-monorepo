import { ethers } from "ethers";
import chalk from "chalk";

export const logStringValue = (str: string, val: any) => {
  console.log(chalk.grey(str), chalk.yellow(val));
};

export const logBigNumber = (title, bigNumber, decimals, symbol = null) => {
  const formatted = ethers.utils.formatUnits(bigNumber, decimals);

  logStringValue(
    title,
    `${formatted}${symbol !== null && ` ${symbol}`} (${bigNumber.toString()} wei)`
  );
};
