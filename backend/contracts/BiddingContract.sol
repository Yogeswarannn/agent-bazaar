// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev Minimal interface to check task status before releasing winner bond.
 */
interface ITaskContract {
    enum TaskStatus {
        OPEN, ASSIGNED, SUBMITTED, VERIFIED, FAILED, CANCELLED
    }
    struct Task {
        uint256 id;
        uint256 jobId;
        address client;
        string  title;
        string  rubricCID;
        uint256 budget;
        uint256 deadline;
        TaskStatus status;
        address assignedAgent;
        string  outputCID;
        uint256 retryCount;
        uint256 retryBonusBps;
    }
    function getTask(uint256 taskId) external view returns (Task memory);
}

/**
 * @title BiddingContract
 * @notice Agents watch the blockchain for OPEN tasks that match their skills.
 *         They submit a bid: a quoted price (≤ task budget) and a
 *         capability proof (CID of credentials / past work scores).
 *
 *         Selection is automatic:
 *         - Lowest price wins among bids that meet a minimum reputation score.
 *         - Ties broken by earliest submission timestamp.
 *         - After the bidding window closes, anyone can call `selectWinner()`
 *           and the contract assigns the agent to the TaskContract.
 *
 *         Agents must stake a small USDC bond when bidding to prevent spam.
 *         Losers withdraw their bond via claimRefund() (pull-payment pattern).
 *         Winner's bond is held until they submit work (then released).
 *
 * @dev    Security improvements over v1:
 *         - Pull-payment pattern prevents DoS via reverting token transfers.
 *         - SafeERC20 used for all token operations.
 *         - Duplicate bids blocked per agent per task.
 *         - Winner bond release gated on task submission status.
 */
contract BiddingContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Types ────────────────────────────────────────────────────────────────

    struct Bid {
        address agent;
        uint256 quotedPrice;      // USDC the agent is willing to accept
        string  credentialsCID;   // IPFS CID: agent's skills proof / past score
        uint256 reputationScore;  // On-chain score (0–1000); set by reputation oracle
        uint256 timestamp;
        bool    isWinner;
    }

    struct BidRound {
        uint256 taskId;
        uint256 windowClose;      // Unix timestamp when bidding closes
        uint256 minReputation;    // Agents below this score are rejected
        uint256 bondAmount;       // USDC stake required to bid
        bool    settled;
        address winner;
        Bid[]   bids;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public taskContract;
    address public reputationOracle;  // Trusted off-chain oracle that writes scores

    uint256 public defaultBidWindow    = 30 minutes;
    uint256 public defaultMinReputation = 100;        // out of 1000
    uint256 public defaultBondAmount;                 // e.g. 1 USDC (1_000_000)

    mapping(uint256 => BidRound) public bidRounds;    // taskId → round

    // agent → taskId → bond amount held (for pull-payment withdrawal)
    mapping(address => mapping(uint256 => uint256)) public agentBonds;

    // Prevent duplicate bids: taskId → agent → hasBid
    mapping(uint256 => mapping(address => bool)) public hasBid;

    // Pull-payment ledger: agent → taskId → refundable amount
    mapping(address => mapping(uint256 => uint256)) public pendingRefunds;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BidRoundOpened(uint256 indexed taskId, uint256 windowClose, uint256 bondAmount);
    event BidPlaced(uint256 indexed taskId, address indexed agent, uint256 quotedPrice);
    event WinnerSelected(uint256 indexed taskId, address indexed winner, uint256 price);
    event BidRefunded(uint256 indexed taskId, address indexed agent, uint256 amount);
    event ReputationUpdated(address indexed agent, uint256 newScore);

    // ─── Reputation Storage ───────────────────────────────────────────────────

    mapping(address => uint256) public reputation;   // 0–1000

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _taskContract,
        address _reputationOracle,
        uint256 _bondAmount
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Zero USDC address");
        usdc               = IERC20(_usdc);
        taskContract       = _taskContract;
        reputationOracle   = _reputationOracle;
        defaultBondAmount  = _bondAmount;
    }

    // ─── Round Management ─────────────────────────────────────────────────────

    /**
     * @notice Open a bidding round for a task. Called off-chain via a keeper
     *         or by the planner agent right after task creation.
     */
    function openBidRound(
        uint256 taskId,
        uint256 minReputation,
        uint256 bondAmount
    ) external {
        require(bidRounds[taskId].windowClose == 0, "Round already open");

        BidRound storage round = bidRounds[taskId];
        round.taskId        = taskId;
        round.windowClose   = block.timestamp + defaultBidWindow;
        round.minReputation = minReputation == 0 ? defaultMinReputation : minReputation;
        round.bondAmount    = bondAmount == 0    ? defaultBondAmount    : bondAmount;
        round.settled       = false;

        emit BidRoundOpened(taskId, round.windowClose, round.bondAmount);
    }

    // ─── Agent Functions ──────────────────────────────────────────────────────

    /**
     * @notice Submit a bid for an open task.
     * @param taskId          ID of the task to bid on.
     * @param quotedPrice     Amount in USDC the agent will accept (≤ task budget).
     * @param credentialsCID  IPFS CID of credentials / past scores.
     */
    function placeBid(
        uint256 taskId,
        uint256 quotedPrice,
        string  calldata credentialsCID
    ) external nonReentrant {
        BidRound storage round = bidRounds[taskId];
        require(round.windowClose > 0,              "No round open");
        require(block.timestamp < round.windowClose, "Bidding closed");
        require(!round.settled,                      "Round settled");
        require(!hasBid[taskId][msg.sender],         "Already bid on this task");
        require(reputation[msg.sender] >= round.minReputation, "Reputation too low");
        require(quotedPrice > 0,                     "Zero price bid");

        // Mark agent as having bid on this task
        hasBid[taskId][msg.sender] = true;

        // Pull the bond using SafeERC20
        uint256 bond = round.bondAmount;
        if (bond > 0) {
            usdc.safeTransferFrom(msg.sender, address(this), bond);
            agentBonds[msg.sender][taskId] += bond;
        }

        round.bids.push(Bid({
            agent:           msg.sender,
            quotedPrice:     quotedPrice,
            credentialsCID:  credentialsCID,
            reputationScore: reputation[msg.sender],
            timestamp:       block.timestamp,
            isWinner:        false
        }));

        emit BidPlaced(taskId, msg.sender, quotedPrice);
    }

    // ─── Settlement ───────────────────────────────────────────────────────────

    /**
     * @notice Select the winner after the bidding window closes.
     *         Anyone can call this — it's fully deterministic.
     *         Selection rule: lowest quoted price among eligible bids.
     *         Ties broken by earliest timestamp.
     *
     * @dev    Uses pull-payment: loser refunds are credited to pendingRefunds
     *         instead of pushed via transfer, preventing DoS by reverting recipients.
     */
    function selectWinner(uint256 taskId) external nonReentrant {
        BidRound storage round = bidRounds[taskId];
        require(block.timestamp >= round.windowClose, "Window still open");
        require(!round.settled, "Already settled");
        require(round.bids.length > 0, "No bids");

        uint256 winnerIdx    = type(uint256).max;
        uint256 lowestPrice  = type(uint256).max;
        uint256 earliestTime = type(uint256).max;

        for (uint256 i = 0; i < round.bids.length; i++) {
            Bid storage bid = round.bids[i];
            if (
                bid.quotedPrice < lowestPrice ||
                (bid.quotedPrice == lowestPrice && bid.timestamp < earliestTime)
            ) {
                lowestPrice  = bid.quotedPrice;
                earliestTime = bid.timestamp;
                winnerIdx    = i;
            }
        }

        require(winnerIdx != type(uint256).max, "No winner found");

        round.settled = true;
        round.winner  = round.bids[winnerIdx].agent;
        round.bids[winnerIdx].isWinner = true;

        // Credit refunds to losers (pull-payment — no external calls in loop)
        for (uint256 i = 0; i < round.bids.length; i++) {
            if (i != winnerIdx) {
                address loser = round.bids[i].agent;
                uint256 held  = agentBonds[loser][taskId];
                if (held > 0) {
                    agentBonds[loser][taskId] = 0;
                    pendingRefunds[loser][taskId] += held;
                }
            }
        }

        emit WinnerSelected(taskId, round.winner, lowestPrice);

        // Notify TaskContract
        (bool ok,) = taskContract.call(
            abi.encodeWithSignature("assignAgent(uint256,address)", taskId, round.winner)
        );
        require(ok, "TaskContract call failed");
    }

    /**
     * @notice Losers call this to withdraw their bond after settlement.
     *         Pull-payment pattern — safe against DoS.
     */
    function claimRefund(uint256 taskId) external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender][taskId];
        require(amount > 0, "No refund available");

        pendingRefunds[msg.sender][taskId] = 0;
        usdc.safeTransfer(msg.sender, amount);
        emit BidRefunded(taskId, msg.sender, amount);
    }

    /**
     * @notice Release the winner's bond back to them once work is submitted.
     *         Gated on TaskContract status to prevent premature withdrawal.
     */
    function claimWinnerBond(uint256 taskId) external nonReentrant {
        BidRound storage round = bidRounds[taskId];
        require(round.settled, "Not settled");
        require(round.winner == msg.sender, "Not winner");

        // Verify the agent has at least submitted their work
        ITaskContract.Task memory task = ITaskContract(taskContract).getTask(taskId);
        require(
            task.status == ITaskContract.TaskStatus.SUBMITTED ||
            task.status == ITaskContract.TaskStatus.VERIFIED,
            "Work not yet submitted"
        );

        uint256 bond = agentBonds[msg.sender][taskId];
        require(bond > 0, "No bond to claim");

        agentBonds[msg.sender][taskId] = 0;
        usdc.safeTransfer(msg.sender, bond);
        emit BidRefunded(taskId, msg.sender, bond);
    }

    // ─── Reputation Oracle ────────────────────────────────────────────────────

    /**
     * @notice Update an agent's on-chain reputation score.
     *         Only callable by the trusted oracle (updated after each verification).
     */
    function setReputation(address agent, uint256 score) external {
        require(msg.sender == reputationOracle, "Only oracle");
        require(score <= 1000, "Score > 1000");
        reputation[agent] = score;
        emit ReputationUpdated(agent, score);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setDefaultBidWindow(uint256 _seconds) external onlyOwner {
        require(_seconds >= 60, "Min 60s window");
        defaultBidWindow = _seconds;
    }

    function setDefaultBondAmount(uint256 _amount) external onlyOwner {
        defaultBondAmount = _amount;
    }

    function setReputationOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero address");
        reputationOracle = _oracle;
    }

    function setTaskContract(address _taskContract) external onlyOwner {
        require(_taskContract != address(0), "Zero address");
        taskContract = _taskContract;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getBids(uint256 taskId) external view returns (Bid[] memory) {
        return bidRounds[taskId].bids;
    }

    function getBidCount(uint256 taskId) external view returns (uint256) {
        return bidRounds[taskId].bids.length;
    }

    function getPendingRefund(address agent, uint256 taskId) external view returns (uint256) {
        return pendingRefunds[agent][taskId];
    }
}
