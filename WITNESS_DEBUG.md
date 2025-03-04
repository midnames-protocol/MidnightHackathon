# Debugging Witness Issues in Midnight Smart Contracts

When working with Compact smart contracts on Midnight, witness-related errors can be challenging to debug. This document provides guidance on common issues and their solutions.

## Common Witness Issues

### 1. Undefined Witness Values

Error message example:
```
type error: user_passport_data return value at src/bboard.compact; expected value of type struct PassportDataPacket but received undefined
```

**Solution**:
1. Make sure your witness name in the contract matches the name in the witness implementation
2. Check export/import statements to ensure the witness is properly exported
3. Ensure the witness implementation returns the correct type

### 2. Naming Conventions

Compact uses snake_case (`user_passport_data`) in contract code, but JavaScript/TypeScript commonly uses camelCase (`userPassportData`).

**Solution**: Make sure to maintain consistent naming when implementing witnesses:

```typescript
// In witnesses.ts
export const witnesses = {
  // Use the exact same name as in the Compact contract
  userPassportData: (state: BBoardPrivateState) => state.userPassportData,
};
```

### 3. Private State Structure

Make sure your private state structure matches what the witness expects:

```typescript
export interface BBoardPrivateState {
  userPassportData: PassportDataPacket;
  secretKey: Uint8Array;
}

export const createBBoardPrivateState = (
  secretKey: Uint8Array,
  userPassportData: PassportDataPacket
): BBoardPrivateState => ({
  secretKey,
  userPassportData,
});
```

## Testing Witnesses

To test if your witnesses are working properly:

1. Create a simple test file that instantiates your contract
2. Supply mock private state
3. Call a circuit that uses the witness
4. Verify the expected behavior

## General Tips

- Always export your witness implementations
- Match naming conventions exactly
- Ensure all type imports are correct
- Use console logs in development to track what values are being passed
- Check your build folder to ensure the compiled witnesses are available
