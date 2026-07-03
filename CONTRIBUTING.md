<div align="center">

<h1>Contributing to MaskedUSD Protocol</h1>

**Privacy infrastructure for everyday dollars — live on Base.**

[![License](https://img.shields.io/badge/license-Apache--2.0-8B6FE0)](./LICENSE)
[![Live on Base](https://img.shields.io/badge/status-live%20on%20Base-8B6FE0)](https://www.maskedusd.com)
[![Chain](https://img.shields.io/badge/chain-Base%208453-0052FF)](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636)](https://soliditylang.org)
[![Noir](https://img.shields.io/badge/proving-Noir%20%2F%20UltraHonk-1E1E2E)](https://noir-lang.org)
[![Non-custodial](https://img.shields.io/badge/non--custodial-yes-8B6FE0)](#trust-model)
[![Immutable](https://img.shields.io/badge/contracts-immutable-8B6FE0)](#trust-model)
[![X](https://img.shields.io/badge/X-@MaskedUSD-000000)](https://x.com/MaskedUSD)

</div>

---

Thank you for your interest in contributing to **MaskedUSD**. The protocol is **live on Base mainnet (chain `8453`)** and its contracts are **immutable and verified on Basescan**. Because the deployed core cannot be changed, contributions are especially valuable in the surrounding surfaces — client SDK, tooling, documentation, tests, and reviews — and every change is held to a high correctness and safety bar.

This guide explains how to get set up, what we accept, and the standards we hold contributions to.

## Table of contents

- [Ground rules](#ground-rules)
- [What MaskedUSD is](#what-maskedusd-is)
- [Trust model](#trust-model)
- [Deployed contracts](#deployed-contracts)
- [Where contributions help most](#where-contributions-help-most)
- [Development setup](#development-setup)
- [Coding standards](#coding-standards)
- [Testing](#testing)
- [Commit & pull-request process](#commit--pull-request-process)
- [Security disclosure](#security-disclosure)
- [License](#license)
- [Contact](#contact)

---

## Ground rules

- **Be respectful and constructive.** We assume good faith and expect the same in return.
- **Privacy is opt-in and lawful-use-only.** MaskedUSD is privacy infrastructure for everyday dollars — it is **not** a mixer or tumbler. Contributions must not aim to defeat the compliance surfaces (sanctions-screening hooks at the ramps, Privacy-Pools-style association sets gating unshield). Proposals that undermine lawful-use posture will be declined.
- **The core is immutable.** The deployed vault, ramps, and shielded pool are non-upgradeable. Changing a core contract means deploying a *new* one, not patching the live one — treat core-facing proposals accordingly.
- **Never commit secrets.** No private keys, deployer keys, mnemonics, API keys, or `.env` values. Public contract addresses and the public deployer/guardian address are fine.

## What MaskedUSD is

MaskedUSD is a privacy stablecoin protocol on Base built from two tokens:

- **$USDM** — a public ERC-20 dollar (6 decimals), minted 1:1 against native USDC and redeemable 1:1 at any time. The USDC backing is held in an immutable `USDCVault`. $USDM can be **shielded** into a private balance via an opt-in zero-knowledge shielded pool with **in-browser (client-side) proofs**.
- **$MUSD** — a *separate* community/access token launching on Clanker. It is **volatile, unbacked, has no yield, and is not an investment or a security**. It is not part of the protocol core and $USDM's 1:1 backing never depends on it.

The architecture has five conceptual layers:

1. **Public $USDM ERC-20** — the tradeable dollar surface.
2. **Mint/redeem ramps** — `USDCVault`, `MintRamp`, `RedeemRamp`, with sanctions-screening hooks at the legible entry/exit boundary.
3. **Opt-in ShieldedPool** — a Poseidon commitment tree (depth-32 incremental Merkle), a nullifier set, and UTXO/JoinSplit notes (2-in / 2-out for v1).
4. **Proving layer** — Noir circuits proven with **UltraHonk** (Barretenberg, BN254), generated on-chain verifiers, and client-side browser proving via `bb.js`.
5. **Encrypted `NoteMemo` channel** — a permissionless, fund-less encrypted note-discovery channel so recipients can find their incoming private notes.

Privacy-Pools-style **association sets** gate `unshield`, so privacy **complements** compliance rather than defeating it. Selective-disclosure viewing keys let honest users prove their history voluntarily.

## Trust model

Contributors should keep the protocol's honest trust posture in mind — do not describe the system as more (or less) trustless than it is.

- **Non-custodial.** Operators never hold user funds or keys; users self-custody their notes and secrets.
- **Immutable core.** The vault, ramps, and shielded pool are non-upgradeable and verified on Basescan.
- **Guardian role (limited).** A single on-chain `guardian` role exists. It can **pause** entry points and **accept association-set roots** (which gate `unshield`) — and **nothing else**. It **cannot** move, mint, freeze, or otherwise access user funds or keys. Do not describe the system as "fully autonomous" or "zero-admin"; describe the guardian as pause-and-accept-roots only.
- **Off-chain services are liveness/UX, not custody.** Indexers, RPC, and relayers cannot steal funds — payout and fee-recipient addresses are bound inside each proof, so a relayer or front-runner cannot redirect them. A misbehaving service can, at worst, censor or serve stale data, not forge state.

> A security review/audit is planned. The protocol has **not** completed a third-party audit — do not represent it as audited in any contribution, comment, or doc.

## Deployed contracts

Live on **Base mainnet (chain `8453`)**. Addresses are verbatim from `src/lib/contracts.ts`; the pool was deployed at block `48119143`.

| Contract | Role | Address |
| --- | --- | --- |
| **USDM** | Public 1:1 USDC-backed ERC-20 dollar | [`0x09a4184daEdaCdcCcded6087f576E57a05950fef`](https://basescan.org/address/0x09a4184daEdaCdcCcded6087f576E57a05950fef) |
| **USDCVault** | Holds native USDC 1:1 against outstanding $USDM | [`0x7dD602d140C7f12591a9CcBF0d5300F566e36464`](https://basescan.org/address/0x7dD602d140C7f12591a9CcBF0d5300F566e36464) |
| **MintRamp** | USDC in → $USDM; screening hook | [`0x16154843AB66ca01CD14d6f36566479FAA2A3Df3`](https://basescan.org/address/0x16154843AB66ca01CD14d6f36566479FAA2A3Df3) |
| **RedeemRamp** | $USDM → USDC out; screening hook | [`0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb`](https://basescan.org/address/0x6D6E4c124bCb94EA8364FAC4691A779e68d23CDb) |
| **ShieldedPool** | Commitment tree + nullifier set; the privacy core | [`0x0e694f3243a89a91597A35B188F91750b1F1CDe6`](https://basescan.org/address/0x0e694f3243a89a91597A35B188F91750b1F1CDe6) |
| **NoteMemo** | Encrypted note-discovery channel | [`0xF276B64C7e4456fF072D787694c7615A0F62C941`](https://basescan.org/address/0xF276B64C7e4456fF072D787694c7615A0F62C941) |
| **Guardian** | Pause + accept association roots **only** | [`0xd656427d14052adA99B238Fe868A76a15ebC99bE`](https://basescan.org/address/0xd656427d14052adA99B238Fe868A76a15ebC99bE) |

Base mainnet USDC (native, Circle): [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913).

## Where contributions help most

Because the on-chain core is immutable, high-leverage contributions live in the surrounding surfaces:

- **Client SDK & note management** — proving ergonomics, note backup/recovery UX, indexing, witness building.
- **Tooling & tests** — additional Foundry invariant/fuzz coverage, Noir circuit tests, reproducible proof fixtures, developer tooling.
- **Documentation** — architecture explainers, integration guides, walkthroughs (shield → private transfer → unshield), and clarity fixes.
- **Reviews** — careful, adversarial review of proposed changes, especially anything touching proofs, fee routing, or the trust boundary.
- **Interoperability** — wallets, dashboards, and integrations that consume the public ABIs.

If you're planning a substantial change, **open an issue first** to discuss scope and approach before writing code.

## Development setup

Prerequisites:

- **Node.js** ≥ 20 and a package manager (`npm`).
- For contract/circuit work: **Foundry** (`forge`), **Noir** (`nargo`), and **Barretenberg** (`bb`) — pin to the versions used in the target package so proofs and verifiers match bit-exact.

Clone and install:

```bash
git clone https://github.com/maskedusd/<repo>.git
cd <repo>
npm install
```

Common tasks for the web/SDK surface (see `package.json`):

```bash
npm run dev      # start the local dev server
npm run build    # production build
npm run lint     # eslint
```

The dApp is built with **Next.js (App Router) + React + TypeScript + Tailwind CSS v4 + framer-motion + three.js**, using **wagmi + viem** for on-chain reads/writes and **Noir + bb.js** for client-side proofs. It is deployed on Vercel and lives at [www.maskedusd.com](https://www.maskedusd.com) (app at `/app`, whitepaper at `/whitepaper`).

## Coding standards

- **TypeScript** — keep code strictly typed; no `any` without justification. Match the existing formatting and pass `npm run lint` clean.
- **Solidity `0.8.27`** — the UltraHonk verifiers require it; keep the compiler version consistent. Core contracts are immutable, so favor clarity, explicit invariants, and thorough NatSpec.
- **Circuits (Noir)** — changes must reproduce roots and nullifiers **bit-exact** against the published test vectors; a circuit change implies new generated verifiers and a *new* pool, never an in-place upgrade.
- **Keep the trust story honest in code and comments** — describe the guardian as pause + accept-roots only, and never imply a completed audit.

## Testing

Every change should ship with tests, and the full suite must pass:

- **Foundry** — unit, end-to-end, and invariant/fuzz tests. Core safety properties are non-negotiable: the pool is always exactly solvent (`balance == shielded value`), value is conserved (`minted == shielded + paidOut + fees`), no double-spend, no trapped funds under pause (entries are pausable; the `unshield` exit is not), and payouts/fees land only where the proof bound them.
- **Noir** — circuit tests (`nargo test`) covering the `shield`, `transfer`, and `unshield` constraints.
- **SDK** — TypeScript tests asserting client-built proofs verify on-chain against the real verifiers.
- **`npm audit`** must be clean for JS/TS packages.

Please include the relevant test output in your PR description.

## Commit & pull-request process

1. **Fork** the repo and create a topic branch from the default branch.
2. Make focused, well-scoped commits with clear messages.
3. Ensure lint and the full test suite pass locally.
4. Open a **pull request** describing *what* changed, *why*, and *how it was tested*. Link any related issue.
5. Address review feedback; a maintainer will merge once checks pass and the change is approved.

For anything touching proofs, fee routing, the shielded pool, or the trust boundary, expect deeper review — these are the highest-stakes areas of the codebase.

## Security disclosure

**Do not** open a public issue for security vulnerabilities. Report them privately to **[support@maskedusd.com](mailto:support@maskedusd.com)** with enough detail to reproduce. We will acknowledge your report and coordinate a fix and disclosure timeline with you. A formal bug-bounty program is planned.

## License

This project is licensed under the **Apache License 2.0**. By contributing, you agree that your contributions will be licensed under the same terms. See [`LICENSE`](./LICENSE) for the full text.

## Contact

- **Website** — [www.maskedusd.com](https://www.maskedusd.com)
- **X** — [@MaskedUSD](https://x.com/MaskedUSD)
- **Telegram** — [t.me/maskedusd](https://t.me/maskedusd)
- **GitHub** — [github.com/maskedusd](https://github.com/maskedusd)
- **Email** — [support@maskedusd.com](mailto:support@maskedusd.com)

<div align="center">

---

Built on **Base**. Non-custodial, immutable, opt-in privacy — lawful use only.

</div>
