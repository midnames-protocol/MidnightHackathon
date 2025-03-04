import { RequestData } from './RequestData';
import { PassportFormData } from '../components/PassportDataForm';

/**
 * Converts date array in format [YY, MM, DD] to a Date object
 * @param dateArray Array containing [year, month, day]
 * @returns Date object
 */
const convertArrayToDate = (dateArray: number[]): Date => {
  if (dateArray.length !== 3) {
    throw new Error('Invalid date array format');
  }
  
  const year = dateArray[0] + (dateArray[0] < 50 ? 2000 : 1900); // Assuming YY format
  const month = dateArray[1] - 1; // JS months are 0-indexed
  const day = dateArray[2];
  
  return new Date(year, month, day);
};

/**
 * Maps data received from server to PassportFormData format
 */
export const mapRequestDataToPassportData = (requestData: RequestData): PassportFormData | null => {
  try {
    // Accept both "passport-data" and "message" content types
    if (requestData.content.type !== 'passport-data' && requestData.content.type !== 'message') {
      console.warn('Received data is not passport data, type:', requestData.content.type);
      return null;
    }

    const payload = requestData.content.payload;
    
    // Log the received payload for debugging
    console.log('Processing payload:', payload);
    
    // Make sure the payload contains the expected fields
    if (!payload.nationality || !payload.dateOfBirth || 
        (!payload.dateOfExpiry && !payload.expirationDate) || !payload.documentNumber) {
      console.warn('Passport data payload is missing required fields');
      return null;
    }

    // Convert date arrays to Date objects
    const dateOfBirth = Array.isArray(payload.dateOfBirth) 
      ? convertArrayToDate(payload.dateOfBirth) 
      : new Date(payload.dateOfBirth);
    
    // Check if we have dateOfExpiry (from message) or expirationDate (from our interface)
    const expirationDate = payload.dateOfExpiry 
      ? (Array.isArray(payload.dateOfExpiry) ? convertArrayToDate(payload.dateOfExpiry) : new Date(payload.dateOfExpiry))
      : new Date(payload.expirationDate);
    
    // Use the emission date if available, otherwise set to current date
    const dateOfEmission = payload.dateOfEmission 
      ? new Date(payload.dateOfEmission) 
      : new Date();

    return {
      nationality: payload.nationality,
      dateOfBirth: dateOfBirth,
      dateOfEmission: dateOfEmission,
      expirationDate: expirationDate,
      documentNumber: payload.documentNumber,
      firstName: payload.firstName,
      lastName: payload.lastName,
      gender: payload.gender,
      issuingState: payload.issuingState,
      pubkey: payload.pubkey,
    };
  } catch (error) {
    console.error('Error mapping request data to passport data:', error);
    return null;
  }
};
