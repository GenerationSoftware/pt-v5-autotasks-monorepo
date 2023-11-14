import { BigNumber } from 'ethers';
import chalk from 'chalk';

import { getBaseFee } from '@arbitrum/sdk/dist/lib/utils/lib';
import { Interface } from '@ethersproject/abi';
import { L1ToL2MessageGasEstimator } from '@arbitrum/sdk';

import { printSpacer } from './utils';
import { DrawAuctionConfigParams, Relay } from './types';
import {
  ERC_5164_MESSAGE_DISPATCHER_ADDRESS,
  ERC_5164_GREETER_ADDRESS,
  ERC_5164_MESSAGE_EXECUTOR_ADDRESS,
} from './constants';

// This is a fake message ID, used for estimating gas costs on Arbitrum
const RANDOM_BYTES_32_STRING = '0x90344b8b6d0f5572c26c9897fd0170c6d4b3a435268062468c51261fbf8274e9';

export const getArbitrumRelayTxParamsVars = async (
  relay: Relay,
  params: DrawAuctionConfigParams,
) => {
  const { readProvider, chainId } = relay;

  console.log(readProvider, chainId);

  const messageId = RANDOM_BYTES_32_STRING;
  console.log(messageId);

  // 1. Compute `listenerCalldata`:
  const listenerCalldata = new Interface([
    'function rngComplete(uint256,uint256,address,uint32,tuple(address,uint64))',
  ]).encodeFunctionData('rngComplete', [
    relay.context.rngResults.randomNumber,
    relay.context.rngResults.rngCompletedAt,
    params.rewardRecipient,
    relay.context.rngRelayLastSequenceId,
    [
      relay.context.rngLastAuctionResult.recipient,
      relay.context.rngLastAuctionResult.rewardFraction,
    ],
  ]);

  printSpacer();
  printSpacer();

  console.log('new Interface([');
  console.log(
    new Interface(['function rngComplete(uint256,uint256,address,uint32,tuple(address,uint64))']),
  );

  console.log(
    relay.context.rngResults.randomNumber,
    relay.context.rngResults.rngCompletedAt,
    params.rewardRecipient,
    relay.context.rngRelayLastSequenceId,
    [
      relay.context.rngLastAuctionResult.recipient,
      relay.context.rngLastAuctionResult.rewardFraction,
    ],
  );
  printSpacer();
  printSpacer();

  console.log('listenerCalldata');
  console.log(listenerCalldata);

  // 2. Then compute `remoteOwnerCalldata`:
  const remoteRngAuctionRelayListenerAddress = relay.contracts.rngRelayAuctionContract.address;
  printSpacer();
  printSpacer();

  console.log('remoteRngAuctionRelayListenerAddress');
  console.log(remoteRngAuctionRelayListenerAddress);
  const remoteOwnerCalldata = new Interface([
    'function execute(address,uint256,bytes)',
  ]).encodeFunctionData('execute', [remoteRngAuctionRelayListenerAddress, 0, listenerCalldata]);

  printSpacer();
  printSpacer();

  console.log('remoteOwnerCalldata');
  console.log(remoteOwnerCalldata);

  printSpacer();

  console.log('[remoteRngAuctionRelayListenerAddress, 0, listenerCalldata]');
  console.log([remoteRngAuctionRelayListenerAddress, 0, listenerCalldata]);

  // 3. Finally compute `executeMessageData`:
  const executeMessageData = new Interface([
    'function executeMessage(address,bytes,bytes32,uint256,address)',
  ]).encodeFunctionData('executeMessage', [
    ERC_5164_GREETER_ADDRESS[chainId], // remoteOwnerAddress ?
    remoteOwnerCalldata,
    messageId,
    params.rngChainId,
    params.rngRelayerAddress,
  ]);

  printSpacer();
  printSpacer();

  console.log('executeMessageData');
  console.log(executeMessageData);
  console.log([
    ERC_5164_GREETER_ADDRESS[chainId], // remoteOwnerAddress ?
    remoteOwnerCalldata,
    messageId,
    params.rngChainId,
    params.rngRelayerAddress,
  ]);

  printSpacer();
  printSpacer();

  const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(readProvider);
  console.log('l1ToL2MessageGasEstimate');
  console.log(l1ToL2MessageGasEstimate);

  printSpacer();
  printSpacer();

  const baseFee = await getBaseFee(readProvider);
  console.log('baseFee');
  console.log(baseFee);
  console.log(baseFee.toString());

  printSpacer();
  printSpacer();
  console.log(
    {
      from: ERC_5164_MESSAGE_DISPATCHER_ADDRESS[chainId],
      to: ERC_5164_MESSAGE_EXECUTOR_ADDRESS[chainId],
      l2CallValue: BigNumber.from(0),
      excessFeeRefundAddress: params.rngRelayerAddress,
      callValueRefundAddress: params.rngRelayerAddress,
      data: executeMessageData,
    },
    baseFee,
    params.rngReadProvider,
  );

  /**
   * The estimateAll method gives us the following values for sending an L1->L2 message
   * (1) maxSubmissionCost: The maximum cost to be paid for submitting the transaction
   * (2) gasLimit: The L2 gas limit
   * (3) deposit: The total amount to deposit on L1 to cover L2 gas and L2 message value
   */
  const { deposit, gasLimit, maxSubmissionCost } = await l1ToL2MessageGasEstimate.estimateAll(
    {
      from: ERC_5164_MESSAGE_DISPATCHER_ADDRESS[chainId],
      to: ERC_5164_MESSAGE_EXECUTOR_ADDRESS[chainId],
      l2CallValue: BigNumber.from(0),
      excessFeeRefundAddress: params.rngRelayerAddress,
      callValueRefundAddress: params.rngRelayerAddress,
      data: executeMessageData,
    },
    baseFee,
    params.rngReadProvider,
  );

  const gasPriceBid = await readProvider.getGasPrice();
  printSpacer();
  console.log(chalk.yellow(`L2 gas price: ${gasPriceBid.toString()}`));
  printSpacer();

  return { gasLimit, maxSubmissionCost, gasPriceBid };
};
