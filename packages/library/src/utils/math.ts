import { ethers, BigNumber } from "ethers";

export const roundTwoDecimalPlaces = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const parseBigNumberAsFloat = (amountBigNum: BigNumber, decimals: number): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, decimals));
};
