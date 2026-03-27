// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title JobManager
 * @notice Entry point for the decentralised AI gig system.
 *         A client posts a job description and deposits USDC.
 *         This contract locks the funds and emits an event that
 *         off-chain planner agents listen to, which then split
 *         the job into sub-tasks via the TaskContract.
 */
contract JobManager is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum JobStatus {
        OPEN,        // Just posted, waiting for planner to split
        IN_PROGRESS, // Sub-tasks have been created
        COMPLETED,   // All sub-tasks verified and paid out
        CANCELLED    // Client cancelled before any work began
    }

    struct Job {
        uint256 id;
        address client;
        string  descriptionCID;   // IPFS CID of the full job description
        uint256 totalBudget;      // USDC amount (6 decimals)
        uint256 remainingBudget;
        JobStatus status;
        uint256 createdAt;
        address taskContractAddr; // Set when planner spawns tasks
    }

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public taskContract;       // Authorised TaskContract
    uint256 public nextJobId;
    uint256 public platformFeeBps;     // e.g. 200 = 2%
    address public feeTreasury;

    mapping(uint256 => Job) public jobs;

    // ─── Events ───────────────────────────────────────────────────────────────

    event JobPosted(
        uint256 indexed jobId,
        address indexed client,
        string  descriptionCID,
        uint256 budget
    );
    event JobSplit(uint256 indexed jobId, address taskContract);
    event JobCompleted(uint256 indexed jobId);
    event JobCancelled(uint256 indexed jobId, uint256 refund);
    event TaskContractSet(address indexed taskContract);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _feeTreasury,
        uint256 _platformFeeBps
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Bad USDC address");
        usdc           = IERC20(_usdc);
        feeTreasury    = _feeTreasury;
        platformFeeBps = _platformFeeBps;
    }

    // ─── Client Functions ─────────────────────────────────────────────────────

    /**
     * @notice Post a new job and lock USDC in this contract.
     * @param descriptionCID  IPFS CID pointing to the job brief.
     * @param budget          Total USDC (6 decimals) to lock.
     */
    function postJob(
        string calldata descriptionCID,
        uint256 budget
    ) external nonReentrant returns (uint256 jobId) {
        require(budget > 0, "Budget must be > 0");
        require(bytes(descriptionCID).length > 0, "No CID provided");

        // Deduct platform fee upfront
        uint256 fee     = (budget * platformFeeBps) / 10_000;
        uint256 netBudget = budget - fee;

        // Pull USDC from client
        usdc.transferFrom(msg.sender, address(this), budget);

        // Send fee to treasury immediately
        if (fee > 0) {
            usdc.transfer(feeTreasury, fee);
        }

        jobId = nextJobId++;
        jobs[jobId] = Job({
            id:              jobId,
            client:          msg.sender,
            descriptionCID:  descriptionCID,
            totalBudget:     netBudget,
            remainingBudget: netBudget,
            status:          JobStatus.OPEN,
            createdAt:       block.timestamp,
            taskContractAddr: address(0)
        });

        emit JobPosted(jobId, msg.sender, descriptionCID, netBudget);
    }

    /**
     * @notice Cancel a job that hasn't been split yet — full refund.
     */
    function cancelJob(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Not your job");
        require(job.status == JobStatus.OPEN, "Cannot cancel at this stage");

        job.status = JobStatus.CANCELLED;
        uint256 refund = job.remainingBudget;
        job.remainingBudget = 0;

        usdc.transfer(msg.sender, refund);
        emit JobCancelled(jobId, refund);
    }

    // ─── TaskContract Interface ───────────────────────────────────────────────

    /**
     * @notice Called by the TaskContract to mark a job as in-progress
     *         and transfer budget allocation to the TaskContract.
     */
    function allocateBudget(
        uint256 jobId,
        uint256 amount
    ) external nonReentrant {
        require(msg.sender == taskContract, "Only TaskContract");
        Job storage job = jobs[jobId];
        require(
            job.status == JobStatus.OPEN || job.status == JobStatus.IN_PROGRESS,
            "Job not open or in-progress"
        );
        require(amount <= job.remainingBudget, "Insufficient budget");

        job.remainingBudget -= amount;

        // Only transition on first allocation
        if (job.status == JobStatus.OPEN) {
            job.status           = JobStatus.IN_PROGRESS;
            job.taskContractAddr = taskContract;
            emit JobSplit(jobId, taskContract);
        }

        usdc.transfer(taskContract, amount);
    }

    /**
     * @notice Called by the TaskContract when every sub-task is verified
     *         and paid — marks the top-level job complete.
     */
    function markJobCompleted(uint256 jobId) external {
        require(msg.sender == taskContract, "Only TaskContract");
        jobs[jobId].status = JobStatus.COMPLETED;
        emit JobCompleted(jobId);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setTaskContract(address _taskContract) external onlyOwner {
        require(_taskContract != address(0), "Zero address");
        taskContract = _taskContract;
        emit TaskContractSet(_taskContract);
    }

    function setFeeBps(uint256 _bps) external onlyOwner {
        require(_bps <= 1000, "Max 10%");
        platformFeeBps = _bps;
    }

    function setFeeTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        feeTreasury = _treasury;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }
}
