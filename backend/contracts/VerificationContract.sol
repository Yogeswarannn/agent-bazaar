// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VerificationContract
 * @notice Completely independent verification layer — no opinion, no gut feel.
 *
 *         When an agent submits work, an off-chain verifier AI (different model,
 *         different provider from the one that did the work) scores the output
 *         against the rubric that was baked into the task at creation time.
 *
 *         For code tasks: runs in a sandbox and passes / fails real unit tests.
 *         For content tasks: scores against rubric dimensions (clarity, SEO, etc.).
 *
 *         The verifier AI submits a signed score report on-chain. Multiple
 *         verifier nodes can be registered; a minimum quorum of passing votes
 *         is required before payment is released.
 *
 *         Pass  → calls TaskContract.markVerified()  → agent gets paid instantly.
 *         Fail  → calls TaskContract.markFailed()    → task reposted with bonus.
 *         After a fail, the agent's reputation score is decremented by the oracle.
 *
 * @dev    Security improvements over v1:
 *         - Uses a per-task nonce so retried tasks can have fresh verification
 *           rounds without colliding with the old one.
 *         - Zero-address checks on admin setters.
 */
contract VerificationContract is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum VerificationStatus {
        PENDING,   // Waiting for verifier votes
        PASSED,
        FAILED
    }

    struct ScoreReport {
        address verifier;
        uint256 score;          // 0–100
        string  evidenceCID;    // IPFS CID of detailed score breakdown
        bool    passed;
        uint256 timestamp;
    }

    struct VerificationRound {
        uint256 taskId;
        uint256 nonce;          // Which retry attempt this round belongs to
        string  rubricCID;      // Copied from Task at round creation
        string  outputCID;      // The submitted work to evaluate
        uint256 passThreshold;  // Minimum score to pass (e.g. 70 = 70/100)
        uint256 quorum;         // Number of verifier votes required
        uint256 passVotes;
        uint256 failVotes;
        VerificationStatus status;
        ScoreReport[] reports;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public taskContract;
    address public biddingContract;   // To update agent reputation after verdict

    uint256 public defaultPassThreshold = 70;
    uint256 public defaultQuorum        = 1;   // Start with 1; raise to 3 for production

    // taskId → nonce → VerificationRound  (nonce increments on each retry)
    mapping(uint256 => mapping(uint256 => VerificationRound)) public rounds;

    // taskId → current active nonce
    mapping(uint256 => uint256) public taskNonce;

    mapping(address => bool) public authorisedVerifiers;

    // prevent double-voting: taskId → nonce → verifier → voted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    // ─── Events ───────────────────────────────────────────────────────────────

    event VerificationRoundOpened(
        uint256 indexed taskId,
        uint256 nonce,
        string  rubricCID,
        string  outputCID,
        uint256 passThreshold,
        uint256 quorum
    );
    event VoteSubmitted(
        uint256 indexed taskId,
        uint256 nonce,
        address indexed verifier,
        uint256 score,
        bool    passed
    );
    event TaskPassed(uint256 indexed taskId, uint256 nonce, uint256 avgScore);
    event TaskFailed(uint256 indexed taskId, uint256 nonce, uint256 avgScore);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _taskContract,
        address _biddingContract
    ) Ownable(msg.sender) {
        require(_taskContract != address(0), "Zero taskContract");
        require(_biddingContract != address(0), "Zero biddingContract");
        taskContract     = _taskContract;
        biddingContract  = _biddingContract;
    }

    // ─── Round Management ─────────────────────────────────────────────────────

    /**
     * @notice Open a verification round for a submitted task.
     *         Called by an authorised keeper / the task submission event listener.
     *         Safe for retries: each call increments the nonce, producing a
     *         fresh round even if a previous round exists for the same taskId.
     */
    function openRound(
        uint256 taskId,
        string  calldata rubricCID,
        string  calldata outputCID
    ) external {
        require(authorisedVerifiers[msg.sender] || msg.sender == owner(),
            "Not authorised");

        // If there's already an active round, it must be settled (PASSED or FAILED)
        uint256 currentNonce = taskNonce[taskId];
        if (rounds[taskId][currentNonce].quorum != 0) {
            require(
                rounds[taskId][currentNonce].status != VerificationStatus.PENDING,
                "Previous round still pending"
            );
            // Increment nonce for the new retry round
            currentNonce++;
            taskNonce[taskId] = currentNonce;
        }

        VerificationRound storage r = rounds[taskId][currentNonce];
        r.taskId        = taskId;
        r.nonce         = currentNonce;
        r.rubricCID     = rubricCID;
        r.outputCID     = outputCID;
        r.passThreshold = defaultPassThreshold;
        r.quorum        = defaultQuorum;
        r.status        = VerificationStatus.PENDING;

        emit VerificationRoundOpened(
            taskId, currentNonce, rubricCID, outputCID, r.passThreshold, r.quorum
        );
    }

    // ─── Verifier Interface ───────────────────────────────────────────────────

    /**
     * @notice An authorised verifier AI submits its score.
     * @param taskId       Task being evaluated.
     * @param score        0–100 score against the rubric.
     * @param evidenceCID  IPFS CID of the detailed breakdown (dimension scores,
     *                     sandbox test results, etc.)
     */
    function submitScore(
        uint256 taskId,
        uint256 score,
        string  calldata evidenceCID
    ) external nonReentrant {
        require(authorisedVerifiers[msg.sender], "Not an authorised verifier");

        uint256 nonce = taskNonce[taskId];
        VerificationRound storage r = rounds[taskId][nonce];
        require(r.status == VerificationStatus.PENDING, "Round not pending");
        require(!hasVoted[taskId][nonce][msg.sender], "Already voted");
        require(score <= 100, "Score > 100");

        hasVoted[taskId][nonce][msg.sender] = true;
        bool passed = score >= r.passThreshold;

        r.reports.push(ScoreReport({
            verifier:    msg.sender,
            score:       score,
            evidenceCID: evidenceCID,
            passed:      passed,
            timestamp:   block.timestamp
        }));

        if (passed) {
            r.passVotes++;
        } else {
            r.failVotes++;
        }

        emit VoteSubmitted(taskId, nonce, msg.sender, score, passed);

        // Check quorum
        _trySettle(taskId, nonce);
    }

    // ─── Internal Settlement ──────────────────────────────────────────────────

    function _trySettle(uint256 taskId, uint256 nonce) internal {
        VerificationRound storage r = rounds[taskId][nonce];
        uint256 totalVotes = r.passVotes + r.failVotes;

        if (totalVotes < r.quorum) return; // Not enough votes yet

        // Majority vote determines outcome
        uint256 avgScore = _averageScore(r);

        if (r.passVotes > r.failVotes) {
            r.status = VerificationStatus.PASSED;
            emit TaskPassed(taskId, nonce, avgScore);

            (bool ok,) = taskContract.call(
                abi.encodeWithSignature("markVerified(uint256)", taskId)
            );
            require(ok, "markVerified call failed");

        } else {
            r.status = VerificationStatus.FAILED;
            emit TaskFailed(taskId, nonce, avgScore);

            (bool ok,) = taskContract.call(
                abi.encodeWithSignature("markFailed(uint256)", taskId)
            );
            require(ok, "markFailed call failed");
        }
    }

    function _averageScore(VerificationRound storage r)
        internal view returns (uint256 avg)
    {
        if (r.reports.length == 0) return 0;
        uint256 total;
        for (uint256 i = 0; i < r.reports.length; i++) {
            total += r.reports[i].score;
        }
        avg = total / r.reports.length;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Zero address");
        authorisedVerifiers[verifier] = true;
    }

    function removeVerifier(address verifier) external onlyOwner {
        authorisedVerifiers[verifier] = false;
    }

    function setPassThreshold(uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Max 100");
        defaultPassThreshold = threshold;
    }

    function setQuorum(uint256 quorum) external onlyOwner {
        require(quorum >= 1, "Min quorum 1");
        defaultQuorum = quorum;
    }

    function setTaskContract(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        taskContract = _addr;
    }

    function setBiddingContract(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        biddingContract = _addr;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getReports(uint256 taskId) external view returns (ScoreReport[] memory) {
        uint256 nonce = taskNonce[taskId];
        return rounds[taskId][nonce].reports;
    }

    /// @notice Get reports for a specific nonce (useful for historical queries).
    function getReportsByNonce(uint256 taskId, uint256 nonce)
        external view returns (ScoreReport[] memory)
    {
        return rounds[taskId][nonce].reports;
    }

    function getRound(uint256 taskId) external view returns (
        VerificationStatus status,
        uint256 passVotes,
        uint256 failVotes,
        uint256 quorum,
        uint256 passThreshold,
        uint256 nonce
    ) {
        uint256 n = taskNonce[taskId];
        VerificationRound storage r = rounds[taskId][n];
        return (r.status, r.passVotes, r.failVotes, r.quorum, r.passThreshold, n);
    }
}
