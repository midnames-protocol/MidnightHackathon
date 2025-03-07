/**
 * Provides types and utilities for working with bulletin board contracts.
 *
 * @packageDocumentation
 */

import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import type { BBoardDerivedState, BBoardContract, BBoardProviders, DeployedBBoardContract } from './common-types.js';
import {
  type BBoardPrivateState,
  Contract,
  createBBoardPrivateState,
  ledger,
  witnesses,
  PassportDataPacket
} from '@midnight-ntwrk/bboard-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/** @internal */
const bboardContractInstance: BBoardContract = new Contract(witnesses);

/**
 * An API for a deployed bulletin board.
 */
export interface DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BBoardDerivedState>;

  validate_nationality: () => Promise<void>;
  validate_adulthood: () => Promise<void>;
  passport_is_unexpired: () => Promise<void>;
}

// Interface for passport data from the UI form
export interface PassportFormData {
  nationality: string;
  dateOfBirth: Date;
  dateOfEmission: Date;
  expirationDate: Date;
}

/**
 * Provides an implementation of {@link DeployedBBoardAPI} by adapting a deployed bulletin board
 * contract.
 */
export class BBoardAPI implements DeployedBBoardAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                },
              },
            }),
          ),
        ),
        // ...private state...
        from(providers.privateStateProvider.get('bboardPrivateState') as Promise<BBoardPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        return {
          adminAddress: ledgerState.adminAddress,
          passport_data: privateState.userPassportData
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<BBoardDerivedState>;

  /**
   * Validates that the user is argentine
   */
  async validate_nationality(): Promise<void> {
    this.logger?.info('Validating nationality');

    try {
      // Check if we have valid passport data first
      const state = await new Promise<BBoardDerivedState>((resolve) => {
        let subscription = this.state$.subscribe((state) => {
          resolve(state);
          subscription.unsubscribe();
        });
      });
      
      console.log('Current nationality in private state:', state.passport_data?.nationality ? 
        new TextDecoder().decode(state.passport_data.nationality) : 'none');
        
      // Create the transaction with explicit error handling
      const txData = await this.deployedContract.callTx.validate_nationality();
      
      this.logger?.trace({
        transactionAdded: {
          circuit: 'validate_nationality',
          txHash: txData.public.txHash,
          blockHeight: txData.public.txHash,
        },
      });
      
      console.log('Nationality verification transaction completed successfully');
    } catch (error) {
      console.error('Error in validate_nationality:', error);
      
      // Specific error handling for different error types
      if (error instanceof Error) {
        if (error.message.includes('Witness')) {
          console.error('Witness generation error - likely invalid nationality format');
        } else if (error.message.includes('transaction')) {
          console.error('Transaction error - check wallet connection and permissions');
        }
      }
      
      // Re-throw the error to be handled by the UI
      throw error;
    }
  }

  /**
   * Validates that the user is over 18
   */
  async validate_adulthood(): Promise<void> {
    this.logger?.info('Validating adulthood');

    const txData = await this.deployedContract.callTx.validate_adulthood();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'validate_adulthood',
        txHash: txData.public.txHash,
        blockHeight: txData.public.txHash,
      },
    });
  }

  /**
   * Validates passport is unexpired
   */
  async passport_is_unexpired(): Promise<void> {
    this.logger?.info('Validating passport expiration');

    const txData = await this.deployedContract.callTx.passport_is_unexpired();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'passport_is_unexpired',
        txHash: txData.public.txHash,
        blockHeight: txData.public.txHash,
      },
    });
  }

  /**
   * Deploys a new bulletin board contract to the network.
   */
  static async deploy(providers: BBoardProviders, passportData?: PassportFormData, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    const deployedBBoardContract = await deployContract(providers, {
      privateStateKey: 'bboardPrivateState',
      contract: bboardContractInstance,
      initialPrivateState: await BBoardAPI.getPrivateState(providers, passportData),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  /**
   * Finds an already deployed bulletin board contract on the network, and joins it.
   */
  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedBBoardContract = await findDeployedContract(providers, {
      contractAddress,
      contract: bboardContractInstance,
      privateStateKey: 'bboardPrivateState',
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(providers: BBoardProviders, passportData?: PassportFormData): Promise<BBoardPrivateState> {
    // Get existing state if available
    const existingPrivateState = await providers.privateStateProvider.get('bboardPrivateState');
    
    // When deploying a new contract with passport data, we should always use that data
    // regardless of whether we have existing private state
    if (passportData) {
      try {
        // Format nationality bytes properly for any nationality
        const encoder = new TextEncoder();
        let nationalityBytes: Uint8Array;
        
        console.log(`Creating passport data for nationality: ${passportData.nationality}`);
        
        // Always create a clean Uint8Array of size 8 first
        nationalityBytes = new Uint8Array(8);
        
        // Format any nationality to the required format: 6 padding chars + 2 letter country code
        // This ensures proper validation will be done by the contract, not by the client
        const countryCode = passportData.nationality.substring(0, 2);
        const formatted = `000000${countryCode}`;
        const bytes = encoder.encode(formatted.slice(-8)); // Ensure we have 8 bytes max
        nationalityBytes.set(bytes);
        
        console.log("Nationality formatted as:", formatted.slice(-8));
        console.log("Nationality bytes (decimal):", Array.from(nationalityBytes));
        console.log("Nationality bytes (hex):", Array.from(nationalityBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        
        const passportDataPacket = {
          nationality: nationalityBytes,
          date_of_birth: BigInt(Math.floor(passportData.dateOfBirth.getTime() / 1000)),
          date_of_emision: BigInt(Math.floor(passportData.dateOfEmission.getTime() / 1000)),
          expiration_date: BigInt(Math.floor(passportData.expirationDate.getTime() / 1000)),
          country_signature: new Uint8Array(32).fill(1), // Placeholder signatures
          midnames_signature: new Uint8Array(32).fill(1)  // Fill with non-zero values
        };
        
        return createBBoardPrivateState(passportDataPacket);
      } catch (error) {
        console.error("Error creating passport data:", error);
        throw error;
      }
    }
    
    // If we have existing state with valid passport data, use it
    if (existingPrivateState?.userPassportData) {
      return existingPrivateState;
    }
    
    // If no data exists and none provided, create an empty passport data structure
    const emptyPassportData = {
      nationality: new Uint8Array(8),
      date_of_birth: BigInt(0),
      date_of_emision: BigInt(0),
      expiration_date: BigInt(0),
      country_signature: new Uint8Array(32),
      midnames_signature: new Uint8Array(32)
    };
    
    return createBBoardPrivateState(emptyPassportData);
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
