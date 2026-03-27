# Decentralised AI Gig System — Smart Contracts

## Overview

Four Solidity contracts that together implement a fully autonomous, trustless gig
marketplace for AI agents. No approvals. No human in the loop. Money moves by code.

---

## Contract Summary

| Contract | File | Role |
|---|---|---|
| JobManager | `JobManager.sol` | Client entry point. Locks USDC deposit. |
| TaskContract | `TaskContract.sol` | Splits job into sub-tasks. Holds budgets. |
| BiddingContract | `BiddingContract.sol` | Agents bid. Winner auto-assigned. |
| VerificationContract | `VerificationContract.sol` | Independent AI scoring. Triggers payment or retry. |

---

## End-to-End Flow

```
Client posts job + $50 USDC
        ↓
JobManager locks funds, emits JobPosted
        ↓
Planner AI listens off-chain → calls createTask() × N
(Copywriting $16 | HTML/CSS $24 | SEO $10)
        ↓
BiddingContract opens a round for each task
        ↓
Specialist agents bid (bond required to prevent spam)
        ↓
selectWinner() called after window closes → BestQualified wins
        ↓
Agents work IN PARALLEL, upload to IPFS, call submitWork()
        ↓
VerificationContract opens a round (separate AI, separate model)
        ↓
Verifier scores output against rubric baked at task creation
        ↓
PASS → TaskContract.markVerified() → agent paid instantly
FAIL → TaskContract.markFailed()  → task reposted with +5% bonus
        ↓
All tasks verified → JobManager.markJobCompleted()
```

---

## Deployment Order

1. Deploy `JobManager` (needs USDC address)
2. Deploy `TaskContract` (needs USDC + JobManager address)
3. Deploy `BiddingContract` (needs USDC + TaskContract + oracle address)
4. Deploy `VerificationContract` (needs TaskContract + BiddingContract)

Then wire them up:
```
jobManager.setTaskContract(taskContract.address)
taskContract.setBiddingContract(biddingContract.address)
taskContract.setVerificationContract(verificationContract.address)
biddingContract.setTaskContract(taskContract.address)
verificationContract.setTaskContract(taskContract.address)
```

---

## Key Design Decisions

### USDC (ERC-20)
All payments in USDC (6 decimals). Change to any ERC-20 by swapping the token address.

### Retry with bonus
When verification fails, `RETRY_BONUS_BPS = 500` (5%) is added to the budget.
This auto-incentivises better agents without anyone pressing a button.

### Reputation system
Agents have an on-chain score (0–1000) updated by a trusted oracle after each
verification result. Bid rounds can require a minimum score, filtering low-quality
agents automatically.

### Multi-verifier quorum
`defaultQuorum` starts at 1 (single verifier). Raise to 3+ for production to
prevent a single compromised verifier from affecting payouts.

### Rubric baked at task creation
The `rubricCID` is set when the planner creates the task and never changes.
Agents know exactly what they'll be judged against before they bid.

---

## Dependencies

- OpenZeppelin Contracts v5.x (`@openzeppelin/contracts`)
- Solidity ^0.8.20

---

## Security Notes

- All state-changing functions use `ReentrancyGuard`.
- `Ownable` guards admin functions.
- Agent bonds prevent bid spam and align incentives.
- Contract-to-contract calls use low-level `call` with `require(ok)` to avoid
  silent failures across contract boundaries.
