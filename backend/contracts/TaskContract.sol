// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev Minimal interface to pull budget from JobManager.
 */
interface IJobManager {
    function allocateBudget(uint256 jobId, uint256 amount) external;
}

/**
 * @title TaskContract
 * @notice After the off-chain planner AI has broken a job into sub-tasks,
 *         it calls `createTask()` for each piece (copywriting, HTML/CSS, SEO …).
 *         Each task carries its own budget slice, a scoring rubric CID, and
 *         a deadline. It connects to BiddingContract and VerificationContract.
 */
contract TaskContract is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum TaskStatus {
        OPEN,         // Posted, waiting for bids
        ASSIGNED,     // Winner selected, agent working
        SUBMITTED,    // Agent uploaded output to IPFS
        VERIFIED,     // Verification passed — payment released
        FAILED,       // Verification failed — task reposted
        CANCELLED
    }

    struct Task {
        uint256 id;
        uint256 jobId;
        address client;
        string  title;             // e.g. "HTML/CSS implementation"
        string  rubricCID;         // IPFS CID of scoring rubric baked at creation
        uint256 budget;            // USDC allocated for this sub-task
        uint256 deadline;          // Unix timestamp
        TaskStatus status;
        address assignedAgent;
        string  outputCID;         // IPFS CID uploaded by agent after completion
        uint256 retryCount;        // How many times this task has been reposted
        uint256 retryBonusBps;     // Extra % added on each retry (e.g. 500 = +5%)
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public jobManager;
    address public biddingContract;
    address public verificationContract;

    uint256 public nextTaskId;

    mapping(uint256 => Task) public tasks;
    // jobId → list of taskIds
    mapping(uint256 => uint256[]) public jobTasks;

    uint256 public constant MAX_RETRIES    = 5;
    uint256 public constant RETRY_BONUS_BPS = 500; // +5% per retry

    // ─── Events ───────────────────────────────────────────────────────────────

    event TaskCreated(
        uint256 indexed taskId,
        uint256 indexed jobId,
        string  title,
        uint256 budget,
        uint256 deadline
    );
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event TaskSubmitted(uint256 indexed taskId, string outputCID);
    event TaskVerified(uint256 indexed taskId, address indexed agent, uint256 payout);
    event TaskFailed(uint256 indexed taskId, uint256 newBudget, uint256 retryCount);
    event TaskCancelled(uint256 indexed taskId);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _jobManager
    ) Ownable(msg.sender) {
        usdc       = IERC20(_usdc);
        jobManager = _jobManager;
    }

    // ─── Planner Interface (called off-chain by AI planner) ───────────────────

    /**
     * @notice Create a sub-task. Pulls the budget slice from JobManager
     *         via allocateBudget so this contract actually holds the USDC.
     * @dev    Only the contract owner (planner authority) may call this.
     * @param jobId      Parent job ID.
     * @param title      Short human-readable label.
     * @param rubricCID  IPFS CID of the scoring rubric for verification.
     * @param budget     USDC slice for this task (6 decimals).
     * @param deadline   Unix timestamp by which work must be submitted.
     */
    function createTask(
        uint256 jobId,
        string  calldata title,
        string  calldata rubricCID,
        uint256 budget,
        uint256 deadline
    ) external onlyOwner returns (uint256 taskId) {
        require(budget > 0, "Zero budget");
        require(deadline > block.timestamp, "Deadline in past");

        // Pull the budget slice from JobManager into this contract
        IJobManager(jobManager).allocateBudget(jobId, budget);

        taskId = nextTaskId++;
        tasks[taskId] = Task({
            id:              taskId,
            jobId:           jobId,
            client:          address(0),  // resolved via jobManager if needed
            title:           title,
            rubricCID:       rubricCID,
            budget:          budget,
            deadline:        deadline,
            status:          TaskStatus.OPEN,
            assignedAgent:   address(0),
            outputCID:       "",
            retryCount:      0,
            retryBonusBps:   0
        });

        jobTasks[jobId].push(taskId);

        emit TaskCreated(taskId, jobId, title, budget, deadline);
    }

    // ─── BiddingContract Interface ────────────────────────────────────────────

    /**
     * @notice Called by BiddingContract when an agent wins the bid.
     */
    function assignAgent(uint256 taskId, address agent) external {
        require(msg.sender == biddingContract, "Only BiddingContract");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "Task not open");

        task.status        = TaskStatus.ASSIGNED;
        task.assignedAgent = agent;

        emit TaskAssigned(taskId, agent);
    }

    // ─── Agent Interface ──────────────────────────────────────────────────────

    /**
     * @notice Agent uploads their completed work CID and marks the task submitted.
     * @param outputCID  IPFS CID pointing to the finished deliverable + proof.
     */
    function submitWork(uint256 taskId, string calldata outputCID) external {
        Task storage task = tasks[taskId];
        require(task.assignedAgent == msg.sender, "Not assigned agent");
        require(task.status == TaskStatus.ASSIGNED, "Task not assigned");
        require(block.timestamp <= task.deadline, "Deadline passed");

        task.status    = TaskStatus.SUBMITTED;
        task.outputCID = outputCID;

        emit TaskSubmitted(taskId, outputCID);
    }

    // ─── VerificationContract Interface ──────────────────────────────────────

    /**
     * @notice Called by VerificationContract when work passes the rubric.
     *         Immediately pays the agent and checks if the whole job is done.
     */
    function markVerified(uint256 taskId) external nonReentrant {
        require(msg.sender == verificationContract, "Only VerificationContract");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.SUBMITTED, "Not submitted");

        task.status = TaskStatus.VERIFIED;
        uint256 payout = task.budget;
        task.budget = 0;

        require(usdc.transfer(task.assignedAgent, payout), "Payout transfer failed");
        emit TaskVerified(taskId, task.assignedAgent, payout);

        _checkJobCompletion(task.jobId);
    }

    /**
     * @notice Called by VerificationContract when work fails.
     *         Resets the task to OPEN with a bumped budget (retry bonus),
     *         so a better agent is incentivised to pick it up.
     *         Pulls the bonus USDC from JobManager to stay solvent.
     */
    function markFailed(uint256 taskId) external nonReentrant {
        require(msg.sender == verificationContract, "Only VerificationContract");
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.SUBMITTED, "Not submitted");
        require(task.retryCount < MAX_RETRIES, "Max retries reached");

        task.retryCount++;
        // Bump budget by RETRY_BONUS_BPS on each failure
        uint256 bonus = (task.budget * RETRY_BONUS_BPS) / 10_000;

        // Pull the bonus funds from JobManager so this contract stays solvent
        if (bonus > 0) {
            IJobManager(jobManager).allocateBudget(task.jobId, bonus);
        }

        task.budget  += bonus;
        task.status   = TaskStatus.OPEN;
        task.assignedAgent = address(0);
        task.outputCID     = "";

        emit TaskFailed(taskId, task.budget, task.retryCount);
        // BiddingContract should listen to TaskFailed and re-open bidding
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _checkJobCompletion(uint256 jobId) internal {
        uint256[] storage taskIds = jobTasks[jobId];
        for (uint256 i = 0; i < taskIds.length; i++) {
            if (tasks[taskIds[i]].status != TaskStatus.VERIFIED) return;
        }
        // All tasks verified — notify JobManager
        // (interface call — JobManager just marks the job complete)
        (bool ok,) = jobManager.call(
            abi.encodeWithSignature("markJobCompleted(uint256)", jobId)
        );
        require(ok, "JobManager call failed");
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setBiddingContract(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        biddingContract = _addr;
    }

    function setVerificationContract(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        verificationContract = _addr;
    }

    function setJobManager(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        jobManager = _addr;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getJobTasks(uint256 jobId) external view returns (uint256[] memory) {
        return jobTasks[jobId];
    }
}
