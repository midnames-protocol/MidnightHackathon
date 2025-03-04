import { PassportFormData } from '@midnight-ntwrk/bboard-api';

/**
 * Creates default passport data for testing purposes
 * 
 * @returns A default PassportFormData object
 */
export const createDefaultPassportData = (): PassportFormData => {
  return {
    nationality: "000000AR", // Argentina
    dateOfBirth: new Date(1999, 0, 1), // Jan 1, 1999 - over 21
    dateOfEmission: new Date(2020, 0, 1), // Jan 1, 2020
    expirationDate: new Date(2030, 0, 1) // Jan 1, 2030
  };
};
