
export interface PassportDataPacket {
  nationality: Bytes<8>;
  date_of_birth: bigint;
  date_of_emision: bigint;
  expiration_date: bigint;
  country_signature: Bytes<32>;
  midnames_signature: Bytes<32>;
}

// Type definition for Bytes
export type Bytes<N extends number> = {
  length: N;
  [index: number]: number;
};
