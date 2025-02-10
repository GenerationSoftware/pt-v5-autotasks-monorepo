import { ethers, BigNumber } from 'ethers';
import { parseUnits } from '@ethersproject/units';

export const roundTwoDecimalPlaces = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const parseBigNumberAsFloat = (amountBigNum: BigNumber, decimals: number): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, decimals));
};

export const normalizeBigNumber = (
  number: BigNumber,
  decimalsExponent: number,
  normalizedExponent: number,
): BigNumber => {
  if (decimalsExponent < normalizedExponent) {
    return parseUnits(number.toString(), normalizedExponent - decimalsExponent);
  } else {
    return number;
  }
};
