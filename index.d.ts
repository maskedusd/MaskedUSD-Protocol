// Type definitions for @maskedusd/protocol

export type Address = `0x${string}`;

/** Base mainnet chain metadata. */
export declare const CHAIN: {
  readonly id: 8453;
  readonly name: "Base";
  readonly explorer: "https://basescan.org";
};

/** Live, immutable contract addresses on Base mainnet (chain 8453). */
export declare const ADDRESSES: {
  readonly usdc: Address;
  readonly usdm: Address;
  readonly vault: Address;
  readonly mintRamp: Address;
  readonly redeemRamp: Address;
  readonly pool: Address;
  readonly noteMemo: Address;
  readonly guardian: Address;
};

/** Human-readable ABIs (compatible with viem `parseAbi`). */
export declare const ABIS: {
  readonly erc20: readonly string[];
  readonly mintRamp: readonly string[];
  readonly redeemRamp: readonly string[];
  readonly vault: readonly string[];
  readonly shieldedPool: readonly string[];
  readonly noteMemo: readonly string[];
};

/** The number of decimals for both $USDM and USDC (they are 1:1). */
export declare const TOKEN_DECIMALS: 6;

/** Build a Basescan URL for a contract or wallet address. */
export declare function explorerAddress(address: string): string;

/** Build a Basescan URL for a transaction hash. */
export declare function explorerTx(hash: string): string;
