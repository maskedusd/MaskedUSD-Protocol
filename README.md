<div align="center">

<img src="https://www.maskedusd.com/token/usdm.svg" alt="MaskedUSD" width="88" height="88" />

# MaskedUSD Protocol

**The private dollar on Base — 1:1 USDC-backed, shielded by zero-knowledge proofs you generate in your browser.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-8B6FE0.svg?style=flat-square)](./LICENSE)
[![Live on Base](https://img.shields.io/badge/Live_on-Base_mainnet-8B6FE0?style=flat-square)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)
[![Chain](https://img.shields.io/badge/Chain-Base_8453-0052FF?style=flat-square)](https://basescan.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636?style=flat-square)](https://soliditylang.org)
[![Noir](https://img.shields.io/badge/ZK-Noir_%2B_UltraHonk-1E1E2E?style=flat-square)](https://noir-lang.org)
[![Non-custodial](https://img.shields.io/badge/Non--custodial-8B6FE0?style=flat-square)](#trust-model)
[![Immutable](https://img.shields.io/badge/Contracts-Immutable-8B6FE0?style=flat-square)](#trust-model)

[Website](https://www.maskedusd.com) · [App](https://www.maskedusd.com/app) · [Whitepaper](https://www.maskedusd.com/whitepaper) · [X](https://x.com/MaskedUSD) · [Telegram](https://t.me/maskedusd)

</div>

---

## Table of contents

- [Overview](#overview)
- [The two tokens](#the-two-tokens)
- [Architecture](#architecture)
- [Deployed contracts (Base mainnet)](#deployed-contracts-base-mainnet)
- [Privacy model](#privacy-model)
- [Proving layer](#proving-layer)
- [Trust model](#trust-model)
- [Compliance posture](#compliance-posture)
- [What is hidden vs. visible](#what-is-hidden-vs-visible)
- [Security](#security)
- [Not a mixer](#not-a-mixer)
- [Links](#links)
- [License](#license)

---

## Overview

**MaskedUSD is a privacy stablecoin protocol, live on Base mainnet (chain `8453`).** It gives everyday dollars an opt-in privacy layer without giving up backing or verifiability.

- **`$USDM`** is a public ERC-20 dollar, minted **1:1 against native USDC** and **redeemable 1:1 at any time** (minus fees, no lockups). The USDC backing sits in an **immutable `USDCVault`**.
- Any `$USDM` can be **shielded** into a private balance inside an **opt-in zero-knowledge shielded pool**. Proofs are generated **client-side, in your browser** — note secrets never leave your device.
- The contracts are **immutable** (non-upgradeable) and **source-verified on Basescan**. Operators are **non-custodial**: they never hold user funds or keys.

> Privacy here is a property of the pool you choose to move through — not a claim that every `$USDM` balance is hidden. Shielding is opt-in, and it is for lawful, everyday financial privacy.

---

## The two tokens

| Token | What it is | Backing | Purpose |
| --- | --- | --- | --- |
| **`$USDM`** | Public ERC-20 dollar with an opt-in shielded layer | **1:1 native USDC**, held in the immutable vault | The product you hold, spend, and shield |
| **`$MUSD`** | A **separate** community/access token launching on [Clanker](https://clanker.world) | **None** | Ecosystem utility & access only |

> ⚠️ **`$MUSD` is volatile, UNBACKED, pays no yield, and is not a stablecoin, investment, or security — it can go to zero.** It is complementary to `$USDM` but never the same thing, and a move in the `$MUSD` price can never touch `$USDM`'s 1:1 redemption. This repository is about the protocol and site — not `$MUSD`.

---

## Architecture

MaskedUSD is organized as five conceptual layers over a small, immutable on-chain core.

```
        ┌──────────────────────────────────────────────────────────┐
        │   Client (browser / Farcaster wallet)                     │
        │   wagmi + viem · note manager · Noir + bb.js prover        │
        └───────────────┬───────────────┬──────────────┬───────────┘
          shield/redeem  │      private  │ send    read │ state
        ┌───────────────▼───────────────▼──────────────▼───────────┐
        │            ON-CHAIN CORE  (Base 8453, immutable)          │
        │                                                           │
        │   USDCVault ── MintRamp / RedeemRamp ── ShieldedPool      │
        │   (1:1 backing)  (screening hook)     (commitments,       │
        │                                        nullifiers, IMT)   │
        │                                            │              │
        │             UltraHonk Verifiers (×3) + adapter            │
        │                                                           │
        │   USDM (ERC-20, public surface)      NoteMemo (discovery) │
        └───────────────────────────────────────────────────────────┘
```

1. **Public `$USDM` ERC-20** — the legible dollar surface, LP-able on DEXs.
2. **Mint / redeem ramps** — `USDCVault`, `MintRamp`, `RedeemRamp`, with **sanctions-screening hooks** at the point where dollars become legible.
3. **Opt-in `ShieldedPool`** — a Poseidon commitment Merkle tree (**depth 32**), a nullifier set, and UTXO/JoinSplit notes (**2-in / 2-out**, `Σin = Σout + fee`).
4. **Proving layer** — circuits written in **Noir**, proven with **UltraHonk** (Barretenberg, BN254), verified by immutable on-chain verifier contracts.
5. **Encrypted `NoteMemo` channel** — a permissionless, fund-less discovery channel; senders post output-note secrets encrypted to the recipient's viewing key, recipients trial-decrypt.

---

## Deployed contracts (Base mainnet)

All contracts are **immutable** and **source-verified on Basescan**. Chain ID `8453`.

| Contract | Address | Role |
| --- | --- | --- |
| **USDM** (ERC-20) | [`0x09a4184daEdaCdcCcded6087f576E57a05950fef`](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) | Public 1:1 USDC-backed dollar (6 decimals) |
| **USDCVault** | [`0x7dD602d140C7f12591a9CcBF0d5300F566e36464`](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) | Custodies native USDC backing, 1:1 |
| **MintRamp** | [`0x16154843AB66ca01CD14d6f36566479FAA2A3Df3`](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) | USDC in → USDM out; screening hook |
| **RedeemRamp** | [`0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb`](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) | USDM in → USDC out; screening at exit |
| **ShieldedPool** | [`0x0e694f3243a89a91597A35B188F91750b1F1CDe6`](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) | Commitment tree + nullifier set (privacy core) |
| **NoteMemo** | [`0xF276B64C7e4456fF072D787694c7615A0F62C941`](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) | Encrypted note-discovery channel |

**Underlying asset:** native Base USDC — [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913).

The pool was deployed at block **`48119143`** — the lower bound for scanning `Shield` / `PrivateTransfer` / `Unshield` logs to rebuild the commitment tree.

---

## Privacy model

Funds inside the shielded pool are **notes (UTXOs)**, not account balances.

- **Commitment:** `Poseidon(amount, ownerPubKey, blinding, assetId)`, appended to an incremental Merkle tree of **depth 32** (≈ 4B notes). The pool tracks a window of recent roots so proofs can reference a root a few blocks old without racing the chain tip.
- **Nullifier:** `Poseidon(noteSecret, leafIndex)`, revealed on spend to prevent double-spends **without revealing which commitment was spent**.
- **Private transfer (JoinSplit):** consume input notes, produce output notes, and prove `Σin = Σout + fee` in zero knowledge — supporting **arbitrary amounts**, which a stablecoin needs.
- **Association-set exits:** on **unshield**, a note proves membership in an on-chain-accepted **association root** in addition to membership in the full commitment tree. This is the [Privacy Pools](https://arxiv.org/abs/2405.17100)-style mechanism that lets privacy **complement** compliance — honest funds can prove clean provenance without deanonymizing anyone else.
- **Viewing keys:** each account derives a **read-only** viewing key that can decrypt its own note history for **voluntary** selective disclosure (to an auditor, counterparty, or accountant). Viewing keys never authorize spends.

---

## Proving layer

- **Language:** [Noir](https://noir-lang.org). **Proving system:** UltraHonk via [Barretenberg / `bb.js`](https://github.com/AztecProtocol/aztec-packages) over the BN254 curve.
- **Client-side proving:** proofs for `shield`, `transfer`, and `unshield` are generated **entirely in the browser** with NoirJS + `bb.js`. **Note secrets never leave the device** — there is no trusted proving service.
- **On-chain verification:** three generated UltraHonk verifiers (`shield` / `transfer` / `unshield`) behind an adapter enforce every proof. Payout and fee-recipient addresses are **bound into each proof**, so neither a relayer nor a mempool front-runner can redirect a payout or fee.
- **Fixed verifying keys:** because the contracts are immutable, the verifying keys are frozen — changing a circuit means deploying a **new** pool, never upgrading the old one.

**Frontend / client stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + framer-motion + three.js, with wagmi + viem for on-chain reads/writes and Noir + `bb.js` for proofs. Deployed on Vercel; live at **[www.maskedusd.com](https://www.maskedusd.com)**.

---

## Trust model

MaskedUSD is **non-custodial and immutable**. Users self-custody; operators never hold funds or keys.

- **Contracts are immutable** — no proxies, no upgrade authority on the core.
- **A limited on-chain `guardian` role exists.** It can do exactly two things, and nothing else:
  1. **Pause** entry points during an incident, and
  2. **Accept association-set roots** that gate unshield.
- The guardian **cannot move, mint, freeze, or access user funds or keys, and cannot upgrade any contract.** Accepting association roots is the one exit-side compliance lever — named plainly, not hidden.
- **Pause never traps funds:** pause halts entries, but the unshield **exit path stays open by design** so users can always withdraw to their own control.

> This is deliberately **not** a "fully autonomous / zero admin" system. The guardian's two narrow powers are disclosed honestly so the trust story is verifiable on-chain.

---

## Compliance posture

- **Screening at the boundary.** Sanctions/screening checks run at **mint and redeem** — the legible boundary where dollars enter and exit — not inside the shielded pool. The pool never needs to see identities.
- **Privacy Pools, not a mixer.** Association-set membership gates unshield so honest users can dissociate from known-bad deposits while retaining privacy against everyone else.
- **Opt-in and lawful-use-only.** Shielding is a choice, intended for everyday financial privacy — not evasion.

---

## What is hidden vs. visible

| Visible on-chain | Hidden (in shielded operations) |
| --- | --- |
| That a shield / redeem happened, and USDC amounts crossing the ramps | Links between shielded sender ↔ recipient |
| Commitments and nullifiers (opaque hashes) | Note amounts, owners, and the input → output graph |
| Public `$USDM` ERC-20 transfers (if you stay public) | Which commitment a given nullifier spent |
| Aggregate pool size / total shielded value | Individual private balances |

The ramps are **deliberately legible** — amounts in and out are visible and screened. Privacy is over the **graph and balances inside** the pool, not over the fact that you use it.

---

## Security

- **Immutable + verified.** All contracts are non-upgradeable and source-verified on Basescan, so anyone can review exactly what runs.
- **Property & invariant testing.** The core is guarded by Foundry invariant/fuzz suites asserting solvency (`backing == shielded value`), value conservation (`minted == shielded + paidOut + fees`), no double-spends, correct fee/payout routing, and the no-trapped-funds-under-pause property.
- **Audit status.** Independent security review and smart-contract + ZK-circuit audits are **planned**, with results to be published when complete. **We do not claim an audit we do not have.** Until then, immutability plus on-chain verification let anyone review the deployed bytecode directly.

Found a vulnerability? Please email **[support@maskedusd.com](mailto:support@maskedusd.com)** and avoid public disclosure until it is resolved.

---

## Not a mixer

> **MaskedUSD is not a mixer or tumbler.** It is privacy infrastructure for everyday dollars: balances and transfers are shielded by zero-knowledge proofs that still prove every transfer is valid and fully backed. Association-set exits let privacy complement compliance rather than obscure the origin of funds. It is privacy for normal people — not a tool to launder or hide illicit funds.

---

## Links

| | |
| --- | --- |
| 🌐 Website | https://www.maskedusd.com |
| 🪙 App | https://www.maskedusd.com/app |
| 📄 Whitepaper | https://www.maskedusd.com/whitepaper |
| 🐦 X | https://x.com/MaskedUSD |
| 💬 Telegram | https://t.me/maskedusd |
| 💻 GitHub | https://github.com/maskedusd |
| ✉️ Contact | support@maskedusd.com |

---

## License

Licensed under the **[Apache License, Version 2.0](./LICENSE)**.

<div align="center">

<sub>MaskedUSD · The private dollar on Base · Non-custodial · Immutable</sub>

</div>
