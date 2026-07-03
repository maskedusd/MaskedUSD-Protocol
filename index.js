// @maskedusd/protocol
// Deployed addresses and ABIs for the MaskedUSD protocol on Base.
//
// MaskedUSD is a non-custodial, immutable private dollar on Base. $USDM mints 1:1
// against native USDC and can be shielded into an opt-in zero-knowledge pool. All
// contracts below are immutable (non-upgradeable) and source-verified on Basescan.
//
// The ABIs are human-readable strings, directly compatible with viem's `parseAbi`.
// This package has no runtime dependencies.

/** Base mainnet chain metadata. */
export const CHAIN = Object.freeze({
  id: 8453,
  name: "Base",
  explorer: "https://basescan.org",
});

/**
 * Live, immutable contract addresses on Base mainnet (chain 8453).
 * Verify these on Basescan before use — trust addresses, not names.
 */
export const ADDRESSES = Object.freeze({
  /** Native Base USDC — the backing asset. */
  usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  /** MaskedUSD ($USDM) ERC-20 — the public dollar surface (6 decimals). */
  usdm: "0x09a4184daEdaCdcCcded6087f576E57a05950fef",
  /** USDCVault — custodies the 1:1 native-USDC backing. */
  vault: "0x7dD602d140C7f12591a9CcBF0d5300F566e36464",
  /** MintRamp — deposit USDC, receive $USDM 1:1 (screening hook at entry). */
  mintRamp: "0x16154843AB66ca01CD14d6f36566479FAA2A3Df3",
  /** RedeemRamp — burn $USDM, receive USDC 1:1 (screening hook at exit). */
  redeemRamp: "0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb",
  /** ShieldedPool — commitment tree + nullifier set (the privacy core). */
  pool: "0x0e694f3243a89a91597A35B188F91750b1F1CDe6",
  /** NoteMemo — encrypted note-discovery channel for private sends. */
  noteMemo: "0xF276B64C7e4456fF072D787694c7615A0F62C941",
  /** Guardian — can pause and accept association roots ONLY; cannot move funds. */
  guardian: "0xd656427d14052adA99B238Fe868A76a15ebC99bE",
});

/**
 * Human-readable ABIs (compatible with viem `parseAbi`).
 * Only the externally useful surface is included.
 */
export const ABIS = Object.freeze({
  erc20: [
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ],
  mintRamp: ["function mint(uint256 amount)"],
  redeemRamp: ["function redeem(uint256 amount, address to)"],
  vault: ["function totalBacking() view returns (uint256)"],
  shieldedPool: [
    "function shield(uint256 commitment, uint256 amount, bytes proof)",
    "function transfer(uint256 root, uint256 nullifierA, uint256 nullifierB, uint256 commitmentA, uint256 commitmentB, uint256 fee, address feeRecipient, bytes proof)",
    "function unshield(uint256 root, uint256 associationRoot, uint256 nullifier, address to, uint256 amount, uint256 fee, address feeRecipient, bytes proof)",
    "function currentRoot() view returns (uint256)",
    "function isKnownRoot(uint256 root) view returns (bool)",
    "function acceptedAssociationRoot(uint256 root) view returns (bool)",
    "function nullifierSpent(uint256 nullifier) view returns (bool)",
    "function acceptAssociationRoot(uint256 root)",
    "event Shield(uint256 indexed commitment, uint256 indexed leafIndex, uint256 amount)",
    "event PrivateTransfer(uint256 spentRoot, uint256 indexed nullifierA, uint256 indexed nullifierB, uint256 commitmentA, uint256 commitmentB, uint256 leafIndexA, uint256 leafIndexB, uint256 fee, address feeRecipient)",
  ],
  noteMemo: [
    "function post(uint256 commitment, bytes ciphertext)",
    "function postMany(uint256[] commitments, bytes[] ciphertexts)",
    "event Note(uint256 indexed commitment, bytes ciphertext)",
  ],
});

/** The number of decimals for both $USDM and USDC (they are 1:1). */
export const TOKEN_DECIMALS = 6;

/** Build a Basescan URL for a contract or wallet address. */
export function explorerAddress(address) {
  return `${CHAIN.explorer}/address/${address}`;
}

/** Build a Basescan URL for a transaction hash. */
export function explorerTx(hash) {
  return `${CHAIN.explorer}/tx/${hash}`;
}
