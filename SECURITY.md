<div align="center">

# MaskedUSD Protocol — Security Policy

**Immutable, non-custodial privacy-stablecoin contracts, live on Base.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-8B6FE0.svg?style=flat-square)](https://www.apache.org/licenses/LICENSE-2.0)
[![Live on Base](https://img.shields.io/badge/Live_on-Base-8B6FE0?style=flat-square)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)
[![Chain](https://img.shields.io/badge/Chain-Base_8453-0052FF?style=flat-square)](https://basescan.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636?style=flat-square)](https://soliditylang.org)
[![Noir](https://img.shields.io/badge/ZK-Noir_%2B_UltraHonk-8B6FE0?style=flat-square)](https://noir-lang.org)
[![Non-custodial](https://img.shields.io/badge/Non--custodial-8B6FE0?style=flat-square)](#trust-model)
[![Immutable](https://img.shields.io/badge/Contracts-Immutable-8B6FE0?style=flat-square)](#immutability)

</div>

---

## Table of contents

- [Overview](#overview)
- [Reporting a vulnerability](#reporting-a-vulnerability)
- [Scope](#scope)
- [Trust model](#trust-model)
- [The guardian role](#the-guardian-role)
- [Immutability](#immutability)
- [Deployed contracts](#deployed-contracts)
- [Cryptography](#cryptography)
- [Known risks](#known-risks)
- [Audit status](#audit-status)
- [Coordinated disclosure](#coordinated-disclosure)
- [Safe harbor](#safe-harbor)

---

## Overview

MaskedUSD is a privacy-stablecoin protocol **live on Base mainnet (chain `8453`)**. It issues **$USDM**, a dollar minted 1:1 against native USDC and redeemable 1:1 at any time, with an **opt-in shielded pool** where balances and transfers are proven correct by zero-knowledge proofs generated **client-side, in the user's own browser**.

The protocol is **non-custodial** — operators never hold user funds or keys, and users self-custody at all times — and its core contracts are **immutable** (non-upgradeable) and source-verified on Basescan. Because the code cannot be patched in place, the security of the deployed system is paramount. This document explains how to report issues, what the trust model is, and where the real risks lie.

> MaskedUSD is privacy infrastructure for everyday dollars, designed to **complement compliance, not defeat it**. It is explicitly **not a mixer or tumbler**: screening is enforced at the public mint/redeem ramps, and withdrawals prove membership in an on-chain association set (the Privacy Pools model).

---

## Reporting a vulnerability

**Please report security issues privately. Do not open a public issue, pull request, or social post for anything exploitable.**

- **Email:** [support@maskedusd.com](mailto:support@maskedusd.com) — use a subject line beginning with `SECURITY:`.
- Encrypt sensitive details if you can, and include enough for us to reproduce: affected contract/address, a description of the impact, and a proof-of-concept or reproduction steps where possible.

### What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | within **72 hours** |
| Initial severity assessment | within **7 days** |
| Status updates during triage | at least every **7 days** |
| Public disclosure | coordinated with you, after mitigation (see [Coordinated disclosure](#coordinated-disclosure)) |

We practice good-faith coordinated disclosure and will credit reporters who wish to be named.

### Please include

- The contract address and function involved.
- The chain (mainnet Base `8453`).
- Impact: funds at risk, solvency/invariant break, privacy leak, denial-of-service, etc.
- A minimal reproduction (Foundry test, script, or transaction trace) where feasible.

---

## Scope

### In scope

- The deployed, immutable smart contracts listed under [Deployed contracts](#deployed-contracts): the USDCVault, MintRamp, RedeemRamp, ShieldedPool, the on-chain proof verifiers, the $USDM ERC-20, and the NoteMemo channel.
- The zero-knowledge circuits (Noir) and their generated on-chain verifiers.
- The client proving/SDK logic insofar as a flaw could cause loss of funds, a broken solvency invariant, an accepted invalid proof, or a privacy leak.

**High-value classes we especially want to hear about:**

- Any path that breaks the solvency invariant `USDC in vault ≥ public USDM supply + shielded value`.
- Minting $USDM without locking USDC, or releasing USDC without burning/spending the corresponding value.
- A double-spend of a shielded note, or acceptance of a proof over an invalid state transition.
- A way for the guardian, a relayer, or any operator to move, freeze, or redirect user funds beyond the [documented powers](#the-guardian-role).
- A privacy break that links shielded sender ↔ recipient or reveals note amounts/owners on-chain.

### Out of scope

- The `$MUSD` token. `$MUSD` is a **separate, volatile, unbacked** ecosystem/utility token launching on Clanker — it is **not** a stablecoin, **not** backed by anything, pays no yield, and is not an investment. It is not part of the protocol's security surface, and no `$MUSD` mechanism can affect `$USDM`'s backing.
- Issues in third-party dependencies without a demonstrated impact on this protocol.
- Network-level metadata (IP address, RPC-provider correlation) — outside the protocol's protection; see [Known risks](#known-risks).
- Best-practice/informational findings with no concrete exploit, and automated-scanner output without a proof-of-concept.
- Social engineering, physical attacks, and phishing.
- Testnet (Base Sepolia) deployments — reports are welcome but are triaged below mainnet.

---

## Trust model

MaskedUSD is **non-custodial**. Off-chain services exist for liveness and UX only; **none of them can move user funds**, and the privacy guarantees hold even if a service is malicious or offline (degrade, don't compromise).

| Party | Can do | Cannot do |
| --- | --- | --- |
| **User (self-custody)** | Hold, shield, transfer, unshield, and redeem their own funds; generate their own proofs in-browser | — |
| **Guardian** (on-chain role) | **Pause** entry points; **accept association-set roots** that gate unshield | Move, mint, burn, or freeze funds; access user keys; upgrade contracts; block exits |
| **Relayer** (optional) | Submit a user's `unshield`/`transfer` tx so a fresh recipient needs no ETH | Steal or redirect a payout — the payout address and fee recipient are **bound inside the proof** |
| **Indexer** | Serve Merkle paths and help clients scan for their notes | Forge state; clients verify roots against the chain |
| **RPC provider** | Relay reads/writes to Base | Custody funds or alter contract behavior |

Note secrets are generated and stored **client-side only**. There is **no trusted proving service** — every proof is built on the user's device, and the note witness never leaves it.

---

## The guardian role

The protocol has **one** privileged on-chain role, the **guardian**, and we disclose its powers exactly. This is **not** a "fully autonomous / zero-admin" system — a limited, clearly bounded role exists, and its authority is deliberately narrow:

**The guardian CAN:**

1. **Pause** entry points (mint, redeem, shield, transfer) as an incident circuit-breaker.
2. **Accept association-set roots** — the roots against which an `unshield` proves membership. This is the compliance lever: which roots are accepted determines which notes can withdraw.

**The guardian CANNOT:**

- Move, transfer, mint, burn, or freeze any user funds.
- Access, derive, or recover any user's keys or note secrets.
- Upgrade, replace, or alter any contract (the contracts are immutable).
- **Trap funds via pause.** Pause halts *entries* during an incident; **exits are not pausable by design** — a pause can never prevent a user from withdrawing funds they already control.

The guardian address is public and listed below. Root acceptance is the one exit-side power it holds, and we name it plainly rather than hiding it.

---

## Immutability

The core contracts are **non-upgradeable**. There are no proxies on the core, no admin withdrawal path, and no upgrade authority. The proof verifiers are generated by the proving toolchain and pinned at fixed addresses; the verifying keys are frozen. Changing a circuit would mean deploying an entirely new pool, never mutating the existing one.

**Consequence for security:** bugs in the deployed contracts **cannot be patched in place**. This raises the stakes of every finding and is a core reason we run this disclosure program. All contracts are source-verified on Basescan, so anyone can review exactly what runs.

---

## Deployed contracts

Live on **Base mainnet (chain `8453`)**, deployed at block **48119143**. Verify MaskedUSD **by address**, not by name or ticker — anything else claiming to be MaskedUSD is not us.

| Contract | Role | Address (Basescan) |
| --- | --- | --- |
| **USDM** (ERC-20) | The public dollar surface (6-decimal; mint/burn callable only by the ramps) | [`0x09a4184daEdaCdcCcded6087f576E57a05950fef`](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) |
| **USDCVault** | Custodies the 1:1 native-USDC backing | [`0x7dD602d140C7f12591a9CcBF0d5300F566e36464`](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) |
| **MintRamp** | USDC in → USDM out; runs the sanctions-screening hook | [`0x16154843AB66ca01CD14d6f36566479FAA2A3Df3`](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) |
| **RedeemRamp** | USDM in → USDC out; screening at the exit boundary | [`0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb`](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) |
| **ShieldedPool** | The privacy core: Poseidon commitment tree + nullifier set | [`0x0e694f3243a89a91597A35B188F91750b1F1CDe6`](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) |
| **NoteMemo** | Stateless encrypted payment-notice channel; holds no funds | [`0xF276B64C7e4456fF072D787694c7615A0F62C941`](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) |
| **USDC** (native, Circle) | The canonical backing asset on Base | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) |
| **Guardian** (role) | Pause + accept association roots **only** (see [above](#the-guardian-role)) | [`0xd656427d14052adA99B238Fe868A76a15ebC99bE`](https://basescan.org/address/0xd656427d14052adA99B238Fe868A76a15ebC99bE) |

---

## Cryptography

- **Note model:** funds in the shielded pool are UTXO-style **notes** (commitments), not account balances. A commitment binds `Poseidon(value, ownerPubKey, blinding, assetId)`; spending reveals a nullifier `Poseidon(noteSecret, leafIndex)` that marks the note spent **without revealing which commitment it was**.
- **Commitment tree:** a depth-32 incremental Merkle tree of Poseidon commitments, with a rolling recent-roots window. The on-chain tree, the circuits, and the client all compute roots identically.
- **Private transfers:** 2-in/2-out **JoinSplit** — prove `Σ inputs = Σ outputs + fee` in zero knowledge, with amounts range-checked and payout/fee recipients bound into the proof so a relayer or front-runner cannot redirect them.
- **Proving system:** circuits are written in **Noir** and proven with **UltraHonk (Barretenberg, BN254)**, entirely **client-side in the browser** (WASM). There is no trusted per-circuit ceremony and no trusted prover.
- **Association sets:** on `unshield`, a proof additionally demonstrates membership in an accepted **association-set root** — the Privacy Pools mechanism that lets honest funds prove clean provenance without deanonymizing anyone.
- **Selective disclosure:** each account derives a read-only **viewing key** that can decrypt its own note history for voluntary disclosure. Viewing keys never authorize spends.

---

## Known risks

We state these plainly rather than paper over them:

- **Smart-contract & circuit risk.** A flaw in the contracts or the zero-knowledge circuits could put funds at risk. Because the contracts are immutable, bugs cannot be patched in place.
- **Issuer (Circle) risk.** The backing is native USDC; Circle can freeze the vault's balance. This would halt redemptions while it lasted.
- **Exit-liveness dependency.** Withdrawals require an association root accepted by the guardian. After new deposits, exits depend on the guardian accepting an updated root; if it stops doing so, withdrawals stall until it resumes.
- **Privacy limits.** Privacy strengthens with pool usage. Early on the anonymity set is small, and matching public shield/withdraw amounts or timing can narrow who paid whom. Shields and withdrawals are deliberately legible at the ramps.
- **Network metadata.** IP address and RPC-provider correlation are outside the protocol's protection.
- **Key loss.** Shielded note secrets exist only client-side. If a user loses them (and any backup), the notes are unrecoverable by anyone — including us.

---

## Audit status

Independent security review and audits (smart-contract and a separate ZK-circuit review) **are planned**, and results will be **published when complete**. We do not claim an audit we do not have. Until then, the contracts are immutable and source-verified on Basescan so that anyone can review exactly what is running. A **public bug bounty is planned**; until it launches, please report via the [email process above](#reporting-a-vulnerability).

---

## Coordinated disclosure

1. Report privately to [support@maskedusd.com](mailto:support@maskedusd.com).
2. We acknowledge, triage, and assign a severity.
3. We work on a mitigation. Because the contracts are immutable, mitigation may involve pausing entries, publishing guidance, coordinating a migration to a new deployment, or other operational responses rather than an in-place patch.
4. We agree on a public-disclosure timeline with you and credit you if you wish.

Please give us reasonable time to protect users before any public disclosure.

---

## Safe harbor

We will not pursue or support legal action against researchers who, in good faith:

- make a genuine effort to avoid privacy violations, data destruction, and service interruption;
- test only against assets they own or have explicit permission to test, and stop at the first sign of a confirmed vulnerability;
- do not exploit a finding beyond the minimum necessary to demonstrate it, and never for their own gain or to harm others; and
- report promptly and keep the details confidential until a coordinated disclosure.

Activity conducted consistently with this policy is considered authorized. If in doubt, ask us first at [support@maskedusd.com](mailto:support@maskedusd.com).

---

<div align="center">

**MaskedUSD** — the dollar that can be private.

[Website](https://www.maskedusd.com) · [App](https://www.maskedusd.com/app) · [Whitepaper](https://www.maskedusd.com/whitepaper) · [X](https://x.com/MaskedUSD) · [Telegram](https://t.me/maskedusd) · [GitHub](https://github.com/maskedusd)

Licensed under **Apache-2.0**.

</div>
