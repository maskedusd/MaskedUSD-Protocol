<div align="center">

<img src="https://www.maskedusd.com/hero-lavender.png" alt="MaskedUSD" width="140" />

# MaskedUSD — Protocol Architecture

**The dollar that can be private.**

A privacy stablecoin on Base: a fully-backed, redeemable dollar with an opt-in, zero-knowledge shielded layer — proofs generated in your own browser.

<br/>

[![License](https://img.shields.io/badge/License-Apache--2.0-8B6FE0?style=flat-square)](./LICENSE)
[![Live on Base](https://img.shields.io/badge/Status-Live_on_Base-8B6FE0?style=flat-square)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)
[![Chain](https://img.shields.io/badge/Chain-Base_8453-0052FF?style=flat-square)](https://base.org)
[![Non-custodial](https://img.shields.io/badge/Non--custodial-8B6FE0?style=flat-square)](#5--trust-model--the-guardian-role)
[![Immutable](https://img.shields.io/badge/Contracts-Immutable-8B6FE0?style=flat-square)](#4--on-chain-core)
[![Noir](https://img.shields.io/badge/Proofs-Noir_%2F_UltraHonk-4B2E83?style=flat-square)](#6--proving-layer)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636?style=flat-square)](https://soliditylang.org)

[![Website](https://img.shields.io/badge/Web-maskedusd.com-8B6FE0?style=flat-square)](https://www.maskedusd.com)
[![X](https://img.shields.io/badge/X-@MaskedUSD-1DA1F2?style=flat-square)](https://x.com/MaskedUSD)
[![Telegram](https://img.shields.io/badge/Telegram-maskedusd-229ED9?style=flat-square)](https://t.me/maskedusd)
[![GitHub](https://img.shields.io/badge/GitHub-maskedusd-181717?style=flat-square)](https://github.com/maskedusd)

</div>

---

## Table of contents

1. [Overview](#1--overview)
2. [Design principles](#2--design-principles)
3. [System map](#3--system-map)
4. [On-chain core](#4--on-chain-core)
5. [Trust model — the guardian role](#5--trust-model--the-guardian-role)
6. [Privacy architecture](#6--privacy-architecture)
7. [Proving layer](#7--proving-layer)
8. [Compliance posture](#8--compliance-posture)
9. [Off-chain services](#9--off-chain-services)
10. [Deployed contracts](#10--deployed-contracts)
11. [Lifecycle walkthroughs](#11--lifecycle-walkthroughs)
12. [Tokens](#12--tokens)
13. [Security](#13--security)
14. [Links](#14--links)

---

## 1 · Overview

MaskedUSD is a privacy stablecoin protocol **live on Base mainnet (chain `8453`)**. It is built on a small, deliberately minimal set of **immutable, non-upgradeable** smart contracts, all source-verified on Basescan.

Two tokens:

- **$USDM** — a public ERC-20 dollar, minted **1:1 against native USDC** and **redeemable 1:1 at any time**. The USDC backing is held in an immutable `USDCVault`. Any $USDM balance can be **shielded** into a private balance via an opt-in, zero-knowledge shielded pool, with proofs generated **client-side in the user's browser**.
- **$MUSD** — a **separate** community/access token launching on Clanker. It is **volatile, unbacked, pays no yield, and is not an investment or a security**. It is not the product; this document is about the protocol.

The protocol is **non-custodial**: operators never hold user funds or keys, and users self-custody throughout. A limited on-chain **guardian** role exists — it can **pause** entry points and **accept association-set roots** only. It cannot move, mint, freeze, or otherwise access user funds or keys (see [§5](#5--trust-model--the-guardian-role)).

Privacy is **opt-in and for lawful use**. MaskedUSD follows the [Privacy Pools](https://arxiv.org/abs/2405.17475) model — association sets and opt-in transparency — so that privacy **complements** compliance rather than defeating it. **MaskedUSD is explicitly not a mixer or tumbler.**

> **What is public, and what is private.** MaskedUSD keeps the parts of a stablecoin that *should* be public — that it is fully backed, and that every transfer is valid — public. It makes the part that should be personal — who holds what, and who pays whom, inside the shielded pool — private, at the holder's option.

---

## 2 · Design principles

These are engineering constraints, not slogans — each closes off a whole class of designs.

1. **Immutability is a feature.** The vault, ramps, and shielded pool are non-upgradeable. There are no proxies on the core, no admin withdrawal path, and no authority that can freeze your $USDM, block your exit, or mint unbacked dollars. What you audit is what runs.
2. **Privacy for normal users, not evasion.** The design target is everyday financial privacy. The system follows Privacy Pools: association sets and opt-in transparency instead of indiscriminate mixing.
3. **Compliance in the architecture.** Sanctions screening is enforced at the mint and redeem ramps — the boundary where dollars become legible — wired into the immutable contracts, not bolted on beside them.
4. **The issuer freeze is in the threat model.** The vault holds native USDC, which Circle can freeze. This is treated as a real risk to design and communicate around, not something to pretend away.
5. **No Ponzi surface.** No yield is promised anywhere. $USDM pays nothing — it is a backed dollar. $MUSD pays nothing — it is a volatile utility token.
6. **Name the trusted parties.** The remaining trust is explicit: a guardian that can pause entries and accept association roots, and nothing else.

---

## 3 · System map

```
                        ┌──────────────────────────────────────────────┐
   USER (browser /      │             app.maskedusd.com dApp            │
   wallet)          ────┤  wagmi/viem · note manager · in-browser prover│
                        └───────┬───────────────┬───────────────┬───────┘
                                │               │               │
                    mint/redeem │  private send │    read state │
                                │               │               │
        ┌───────────────────────▼───────────────▼───────────────▼─────────────┐
        │                 OFF-CHAIN SERVICES (liveness/UX, not custody)         │
        │   Note indexer (tree/notes)  ·  Optional relayer  ·  RPC (Base)       │
        └───────────────────────┬───────────────────────────────────┬─────────┘
                                │ txs + proofs                       │ logs
        ┌───────────────────────▼────────────────────────────────────▼─────────┐
        │                 ON-CHAIN CORE (Base 8453, immutable)                   │
        │                                                                        │
        │   USDCVault ── Mint/RedeemRamp ── ShieldedPool ── Verifiers(×3)+adapter│
        │   (1:1 backing) (screening hook)  (commitments,     (UltraHonk         │
        │                                    nullifiers, IMT)   proof check)      │
        │                                                                        │
        │   $USDM (ERC-20, public surface)          NoteMemo (encrypted memos)   │
        └────────────────────────────────────────────────────────────────────────┘
```

The architecture is best read as five conceptual layers: the **public $USDM ERC-20**; the **mint/redeem ramps** (`USDCVault`, `MintRamp`, `RedeemRamp`) with sanctions-screening hooks; the opt-in **ShieldedPool**; the **proving layer** (Noir + UltraHonk, client-side); and the **encrypted NoteMemo channel** for private payment discovery.

---

## 4 · On-chain core

All core contracts are **immutable** (non-upgradeable, no proxies) and **verified on Basescan**. The `USDM` token is a standard **6-decimal ERC-20**.

| Contract | Role | Upgradeable | Privileged authority |
| --- | --- | :---: | --- |
| **USDCVault** | Custodies the native USDC backing, 1:1 against all outstanding $USDM | No | Pause only |
| **MintRamp** | USDC in → $USDM out; runs the sanctions-screening hook | No | Pause only |
| **RedeemRamp** | $USDM in → USDC out; screening at the exit boundary | No | Pause only |
| **ShieldedPool** | The privacy core: a commitment Merkle tree + nullifier set | No | Pause + accept association roots |
| **Verifiers (×3) + adapter** | On-chain UltraHonk verification of every shield / transfer / unshield proof | No | None |
| **USDM** (ERC-20) | Public dollar surface; mint/burn callable only by the ramps | No | None |
| **NoteMemo** | Stateless encrypted payment-notice channel; holds no funds, decoupled from the pool | No | None |

### The solvency invariant

```
USDC in the vault  ≥  public USDM supply + shielded value      (always)
```

Minting increases both sides; redeeming decreases both. No path creates $USDM without locking USDC, and none releases USDC without burning $USDM. This is enforced by contract and exercised by an on-chain invariant/fuzz test suite.

### Pause semantics

Pause is a **circuit-breaker, not a freeze switch**. It halts entry points (mint / shield / transfer) during an incident, but the **unshield exit path remains open by design** — a pause can never trap user funds. This distinction is load-bearing for the trust story.

Contracts are built with **Foundry** and compiled with **solc 0.8.27**.

---

## 5 · Trust model — the guardian role

MaskedUSD is **non-custodial**. Operators never take custody of user funds or keys; users self-custody throughout, and note secrets never leave the user's device.

A single limited on-chain **guardian** role exists. It is disclosed honestly here:

**The guardian CAN:**
- **Pause** the core entry points (a circuit-breaker for incident response).
- **Accept association-set roots** on the shielded pool (`acceptAssociationRoot`), which gate the unshield/withdraw path.

**The guardian CANNOT:**
- Move, spend, or withdraw any user funds.
- Mint $USDM or alter the USDC backing.
- Freeze, seize, or block an individual user's balance.
- Access, recover, or reconstruct any user's keys or note secrets.
- Upgrade, replace, or modify any contract (they are immutable).

> This is **not** a "zero-admin, fully autonomous" system, and we do not claim it to be. The guardian holds exactly two levers — pause, and association-root acceptance — and root acceptance is the named compliance lever: which roots are accepted determines which notes can withdraw. Everything else is fixed in immutable code.

---

## 6 · Privacy architecture

### 6.1 Note model — UTXO / JoinSplit

Funds inside the shielded pool are **notes** (UTXOs), not account balances. A note is a commitment computed with the ZK-friendly **Poseidon** hash:

```
commitment = Poseidon(value, owner_pubkey, blinding, asset_id)
owner_pubkey = Poseidon(owner_privkey)
nullifier    = Poseidon(note_secret, leaf_index)
```

Spending a note reveals only its **nullifier**, which marks it spent (preventing double-spends) **without revealing which commitment it was** — preserving on-chain unlinkability. Private transfers are **JoinSplit**: consume input notes, produce output notes (payment + change), and prove in zero knowledge that `Σ inputs = Σ outputs + fee`. This supports **arbitrary amounts**, which a stablecoin needs — there are no fixed denominations.

### 6.2 Commitment tree

Commitments are appended to an **incremental Merkle tree of depth 32** (~4 billion notes), hashed with Poseidon. The contract tracks a rolling window of **recent roots**, so a proof can reference a root a few blocks old without racing the chain tip. The on-chain tree is bit-exact with the tree computed by the circuits and the client — the same root, computed three ways.

### 6.3 Nullifier set

A mapping of spent nullifiers. A spend proof must show that the input note's commitment is in the tree, that the spender owns it, and that the nullifier is correctly derived; the contract rejects any nullifier already present.

### 6.4 Association sets

On **unshield**, the user proves their note is a member of a chosen **association set** — an on-chain-accepted root representing a subset of deposits — *in addition to* membership in the full commitment tree. Honest users prove "my funds trace to an accepted set," dissociating from flagged deposits without deanonymizing anyone else. This is the Privacy-Pools mechanism that lets privacy complement compliance, and it is built into the circuits, not layered on afterward.

### 6.5 What is hidden vs. visible

| Visible on-chain | Hidden (inside shielded operations) |
| --- | --- |
| That a shield/unshield occurred, and the USDC amounts crossing the ramp | Links between shielded sender and recipient |
| Commitments and nullifiers (opaque hashes) | Note amounts, owners, and the input→output graph |
| Public $USDM ERC-20 transfers (if a user stays public) | Which commitment a nullifier spent |
| Aggregate pool size / total shielded value | Individual private balances |

Honest framing of the limits: **the ramps are deliberately legible** — amounts entering and leaving are visible and screened. Privacy applies to the graph and balances *inside* the pool, not to the fact that you use it.

### 6.6 Payment discovery — NoteMemo

When a user sends privately, they post the output note's secrets — **encrypted to the recipient's viewing key** — to the permissionless **NoteMemo** contract, keyed by the output commitment. Recipients scan `Note` events and trial-decrypt to discover incoming payments. NoteMemo is **stateless and holds no funds**; it is fully decoupled from the pool's value transfer and cannot affect it.

---

## 7 · Proving layer

Circuits are written in **[Noir](https://noir-lang.org)** and proven with **UltraHonk** (Barretenberg / `bb`, over the **BN254** curve). Proving is **client-side**: proofs are generated **in the user's browser** (WASM, via `bb.js` and NoirJS), so **witness data — note secrets, amounts, owners — never leaves the device**. There is no trusted proving service.

The on-chain **verifier contracts are generated by the proving toolchain** and pinned at fixed, immutable addresses. Because immutability freezes the verifying key, changing a circuit means deploying a *new* pool — never upgrading an existing one. Noir/UltraHonk was chosen in part because it requires **no per-circuit trusted-setup ceremony**.

Three circuits back the pool:

| Circuit | Proves |
| --- | --- |
| **shield** | A new commitment correctly encodes a deposit of value `V` (with `V` public, matching the USDC in) |
| **transfer** (JoinSplit) | Input ownership + tree membership, correct nullifiers, `Σin = Σout + fee`, and well-formed outputs |
| **unshield** | Ownership + tree membership + **association-set membership** + correct nullifier + payout amount |

Payout and fee-recipient addresses are **bound into the proof**, so neither a relayer nor a mempool front-runner can redirect a withdrawal or a fee. The UltraHonk verifiers compile comfortably under the EIP-170 24,576-byte contract-size limit, so they run natively on Base.

---

## 8 · Compliance posture

MaskedUSD is designed so that privacy and accountability hold at the same time.

- **Screening where money is legible.** Every mint and every redemption passes an on-chain screening hook at the ramp — the point where dollars touch the regulated world. The pool itself never needs to see identities. Integrating a dedicated third-party screening provider is the designed direction.
- **Association-set exits.** Every withdrawal proves membership in an association root accepted on-chain, so flagged funds can be excluded from exits without deanonymizing honest users.
- **Validity is always public.** Backing, supply, and every state transition are publicly verifiable at all times. Privacy applies to *who* and *how much* — never to *whether the system is solvent and correct*.

> **Not a mixer, by design.** The goal is not to obscure where money came from; it is that your finances should not be a public feed. Privacy is opt-in and for lawful use.

---

## 9 · Off-chain services

Each off-chain service is **liveness/UX infrastructure, not custody** — none can move user funds, and the privacy guarantees hold even if a service is malicious or offline (degrade, don't compromise).

- **Note indexer** — replays `Shield` / `PrivateTransfer` / `Unshield` logs to reconstruct the commitment tree, the user's owned notes, and Merkle membership witnesses. Untrusted: clients verify roots against the chain. A bad indexer can withhold or serve stale data (a liveness issue), never forge state.
- **Optional relayer** — can submit a user's `unshield`/`transfer` so a fresh recipient needs no ETH and the payout isn't linked to a funding address. The relayer **cannot steal** — payout and fee-recipient addresses are bound inside the proof — it can only decline to relay, which the user can route around by self-submitting.
- **RPC** — standard Base reads/writes.
- **Client note manager** — in the browser: holds note secrets (encrypted at rest under a key derived from a wallet signature), scans encrypted memos, tracks the spendable set, and builds witnesses. Note backup/recovery is a first-class concern — losing your secrets means losing access to shielded funds, as with any UTXO wallet.

---

## 10 · Deployed contracts

Live on **Base mainnet (chain `8453`)**. Verify by **address** — not by name or ticker. Anything else claiming to be MaskedUSD is not us.

| Contract | Address | Basescan |
| --- | --- | --- |
| **USDM** (ERC-20) | `0x09a4184daEdaCdcCcded6087f576E57a05950fef` | [view](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) |
| **USDCVault** | `0x7dD602d140C7f12591a9CcBF0d5300F566e36464` | [view](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) |
| **MintRamp** | `0x16154843AB66ca01CD14d6f36566479FAA2A3Df3` | [view](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) |
| **RedeemRamp** | `0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb` | [view](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) |
| **ShieldedPool** | `0x0e694f3243a89a91597A35B188F91750b1F1CDe6` | [view](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) |
| **NoteMemo** | `0xF276B64C7e4456fF072D787694c7615A0F62C941` | [view](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) |

Backing asset: **native USDC on Base** (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).

---

## 11 · Lifecycle walkthroughs

### 11.1 Shield — USDC → private $USDM note

```
1. User approves + deposits V USDC via MintRamp; the screening hook runs (reverts if flagged).
2. The vault credits V; the user receives public $USDM 1:1.
3. Client builds a shield proof in-browser; the pool inserts
   commitment = Poseidon(V, owner_pub, blinding, asset).
4. Client stores the note secret + blinding locally (backup is critical).
   → On-chain: a deposit happened. Hidden: nothing about a private balance yet.
```

### 11.2 Private send — note → note

```
1. Sender builds a JoinSplit: input note(s) they own → output notes
   (one to the recipient's key, one change note back to self).
2. Client generates a proof (ownership + tree membership, correct nullifiers,
   Σin = Σout + fee, well-formed outputs) entirely in-browser.
3. Tx posts proof + nullifier(s) + new commitments; the sender posts an
   encrypted memo to NoteMemo for the recipient.
4. The verifier checks the proof; the pool rejects any spent nullifier and appends outputs.
5. The recipient's client scans NoteMemo, decrypts, and discovers the new note.
   → Hidden: who paid whom, amounts, which commitment was spent.
```

### 11.3 Unshield — private $USDM → USDC

```
1. User's note proves membership in an accepted association root.
2. Client generates: ownership + tree membership + association-set membership
   + correct nullifier + payout to address A (A bound inside the proof).
3. (Optional) a relayer submits the tx so A needs no ETH and isn't linked to funding.
4. RedeemRamp screens A; the verifier checks the proof; the pool marks the nullifier spent.
5. The vault releases USDC to A (minus any fee, which routes to the bound recipient).
   → The exit is legible + screened + provably from an accepted set;
     the link to the user's shielded history stays hidden.
```

---

## 12 · Tokens

| | **$USDM** | **$MUSD** |
| --- | --- | --- |
| **What it is** | The private dollar | A separate community/access token |
| **Backing** | 1:1 native USDC, in the immutable vault | **None** |
| **Stability** | Redeemable 1:1 at any time | **Volatile — can go to zero** |
| **Yield** | None (it is a dollar, not an investment) | **None** |
| **Where** | Minted via the ramps on Base | Launches on Clanker |

> **$MUSD is not a stablecoin, not backed by anything, pays no yield, and is not an investment or a security.** Its role is utility, access, and community around the protocol. **No $MUSD mechanism can ever touch $USDM's backing** — the dollar stands on USDC alone.

---

## 13 · Security

- **Immutable + verified.** All core contracts are non-upgradeable and source-verified on Basescan — anyone can review exactly what runs.
- **Client-side proving.** Note secrets never leave the user's device; every proof is checked by immutable on-chain verifier contracts.
- **Invariant testing.** The pool is exercised by handler-driven invariant/fuzz suites that hold the core safety promises across randomized op sequences: exact solvency (`backing == shielded value`), value conservation, payouts/fees landing where the proof bound them, and no trapped funds under pause.
- **Independent security review and audits are planned; results will be published when complete.** We do not claim an audit we do not have.
- **A public bug bounty is planned.**

**Known risks, stated plainly:**

- **Smart-contract & circuit risk** — a flaw in the contracts or circuits could put funds at risk; immutability means bugs cannot be patched in place.
- **Issuer risk** — the backing is native USDC, whose issuer can freeze the vault's balance, which would halt redemptions while it lasted.
- **Exit liveness** — after new deposits, exits depend on the guardian accepting an updated association root; if it stops, withdrawals stall until it resumes.
- **Privacy limits** — the anonymity set grows with usage; early on it is small, and matching public shield/withdraw amounts or timing can narrow inference. Network-level metadata (IP, RPC provider) is outside the protocol's protection.
- **Key loss** — shielded note secrets exist only client-side; if a user loses them and any backup, the notes are unrecoverable by anyone, including us.

---

## 14 · Links

| | |
| --- | --- |
| **Website** | [www.maskedusd.com](https://www.maskedusd.com) |
| **App** | [www.maskedusd.com/app](https://www.maskedusd.com/app) |
| **Whitepaper** | [www.maskedusd.com/whitepaper](https://www.maskedusd.com/whitepaper) |
| **X** | [@MaskedUSD](https://x.com/MaskedUSD) |
| **Telegram** | [t.me/maskedusd](https://t.me/maskedusd) |
| **GitHub** | [github.com/maskedusd](https://github.com/maskedusd) |
| **Contact** | support@maskedusd.com |

---

<div align="center">

**Licensed under [Apache-2.0](./LICENSE).**

<sub>This document describes software, not an offer, solicitation, or financial advice. It is a living document and will be revised as the protocol evolves.</sub>

</div>
