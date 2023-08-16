import { ethers } from 'ethers';
import chalk from 'chalk';

export const logTable = (obj: any) => {
  if (console.table.name === 'table') {
    console.table(obj);
  } else {
    console.log(obj);
  }
};

export const logStringValue = (str: string, val: any) => {
  console.log(chalk.grey(str), chalk.yellow(val));
};

export const logBigNumber = (title, bigNumber, decimals, symbol = null) => {
  try {
    const formatted = ethers.utils.formatUnits(bigNumber.toString(), decimals);

    logStringValue(
      title,
      `${formatted}${symbol !== null && ` ${symbol}`} (${bigNumber.toString()} wei)`,
    );
  } catch (e) {
    console.log(chalk.dim('Unable to log BigNumber:', title));
  }
};

export const printAsterisks = () => {
  printSpacer();
  console.log(chalk.blue('******************'));
};

export const printSpacer = () => console.log('');
