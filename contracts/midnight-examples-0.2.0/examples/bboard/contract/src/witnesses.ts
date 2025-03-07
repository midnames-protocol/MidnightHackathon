/*
 * This file defines the shape of the bulletin board's private state,
 * as well as the single witness function that accesses it.
 */

import { Ledger, PassportDataPacket } from './managed/bboard/contract/index.cjs';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

/* **********************************************************************
 * The private state needed by the bulletin board contract includes
 * the user's passport data.
 */

export type BBoardPrivateState = {
  readonly userPassportData: PassportDataPacket;
};

export const createBBoardPrivateState = (userPassportData: PassportDataPacket) => ({
  userPassportData,
});

/* **********************************************************************
 * The witnesses object for the bulletin board contract is an object
 * with a field for each witness function, mapping the name of the function
 * to its implementation.
 */
export const witnesses = {
  user_passport_data: ({ privateState }: WitnessContext<Ledger, BBoardPrivateState>): [BBoardPrivateState, PassportDataPacket] => [
    privateState,
    privateState.userPassportData,
  ],
};