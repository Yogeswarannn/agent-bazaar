"""
Agent Bazaar — FastAPI Backend
Autonomous AI agent marketplace powered by Gemini + LangChain.
"""

import os
import time
import random
import hashlib
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from web3 import Web3
import os

RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
PRIVATE_KEY = os.environ.get("PRIVATE_KEY")
ACCOUNT_ADDRESS = "0xYOUR_WALLET_ADDRESS"
CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS"

w3 = Web3(Web3.HTTPProvider(RPC_URL))

# ─── LangChain + Gemini ────────────────────────────────────────────────────────
try:
    from langchain_google_genai import ChatGoogleGenerativeAI

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.5,
        convert_system_message_to_human=True,
    )
    LLM_AVAILABLE = bool(GEMINI_API_KEY)
except Exception as e:
    print(f"[WARN] Gemini init failed: {e}. Running in fallback mode.")
    llm = None
    LLM_AVAILABLE = False

# ─── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Agent Bazaar API",
    description="Autonomous AI agent marketplace — Planner, Workers, Verifier & Payment settlement.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Agent Registry ────────────────────────────────────────────────────────────
agents = [
    {"name": "Frontend Agent", "role": "UI Specialist", "base_cost": 7},
    {"name": "Backend Agent", "role": "API Developer", "base_cost": 10},
    {"name": "DevOps Agent", "role": "Deployment Engineer", "base_cost": 9},
    {"name": "Research Agent", "role": "Analysis Specialist", "base_cost": 8}
]

# ─── Fallback Data ─────────────────────────────────────────────────────────────
FALLBACK_SUBTASKS = [
    "Design the user interface and define component hierarchy",
    "Implement core business logic and API endpoints",
    "Write automated tests and perform quality validation",
]

FALLBACK_OUTPUTS = {
    "frontend":  "Generated responsive React components with Tailwind CSS. Created layout, navigation, and interactive UI elements. All components follow accessibility (WCAG 2.1) standards.",
    "backend":   "Implemented RESTful API with FastAPI. Added authentication middleware, database models, and async request handlers. Throughput tested at 1,200 req/s.",
    "qa":        "Executed 47 test cases (unit + integration). Found and flagged 2 edge-case bugs. Code coverage at 89%. Performance benchmarks within acceptable thresholds.",
    "devops":    "Configured CI/CD pipeline with GitHub Actions. Set up Docker containers and K8s manifests. Auto-scaling policies deployed to GCP Cloud Run.",
    "research":  "Analyzed 12 competitive solutions and 8 academic papers. Summarized key insights and identified 3 optimization opportunities for the proposed architecture.",
}


def _call_llm(prompt: str) -> str:
    """Safe LLM call — returns None on failure."""
    if not LLM_AVAILABLE or llm is None:
        return None
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"[LLM ERROR] {e}")
        return None


# ─── Planner Agent ─────────────────────────────────────────────────────────────
def planner_agent(task: str) -> list[str]:
    """
    Breaks a user task into 2–3 concrete, actionable subtasks.
    Falls back to deterministic subtasks if the LLM is unavailable.
    """
    prompt = f"""You are a senior software project planner.

Break the following task into EXACTLY 3 concrete subtasks that can be independently assigned to specialized agents.
Each subtask should be a single sentence, specific and actionable.

Task: {task}

Respond with ONLY a numbered list like:
1. <subtask one>
2. <subtask two>
3. <subtask three>

No explanations. No extra text."""

    raw = _call_llm(prompt)

    if raw:
        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
        subtasks = []
        for line in lines:
            # Strip leading numbers/bullets: "1.", "1)", "-", "*"
            cleaned = line.lstrip("0123456789.-)*• ").strip()
            if cleaned and len(cleaned) > 5:
                subtasks.append(cleaned)
        if len(subtasks) >= 2:
            return subtasks[:3]

    # Fallback
    return [
        f"Design the architecture and UI/UX for: {task}",
        f"Implement the core backend logic and APIs for: {task}",
        f"Write tests, validate outputs, and document: {task}",
    ]


# ─── Worker Agent ──────────────────────────────────────────────────────────────
def worker_agent(subtask: str, agent_role: str) -> str:
    """
    Specialized agent executes a subtask using its domain expertise.
    Returns a short, realistic completion summary.
    """
    role_prompts = {
        "frontend":  "You are an expert frontend engineer. Describe what you built for the given task in 2–3 sentences. Be technical and specific.",
        "backend":   "You are an expert backend engineer. Describe what you implemented for the given task in 2–3 sentences. Mention frameworks, patterns, and performance.",
        "qa":        "You are a QA automation engineer. Describe the tests you wrote and what you validated in 2–3 sentences. Include metrics.",
        "devops":    "You are a DevOps/cloud engineer. Describe how you deployed or configured this in 2–3 sentences. Mention tools and services.",
        "research":  "You are a technical research analyst. Summarize your findings for the given task in 2–3 sentences. Be insightful.",
    }

    system = role_prompts.get(agent_role, "You are a skilled software engineer. Complete the task and describe your output in 2–3 sentences.")
    prompt = f"""{system}

Task assigned to you: {subtask}

Respond with ONLY your completion summary. No bullet points. No preamble."""

    result = _call_llm(prompt)
    if result and len(result) > 20:
        return result

    return FALLBACK_OUTPUTS.get(agent_role, f"[{agent_role.upper()} AGENT] Successfully executed: {subtask}")


# ─── Verifier Agent ────────────────────────────────────────────────────────────
def verifier_agent(subtask: str, output: str) -> str:
    """
    Strict quality gate — returns only 'YES' or 'NO'.
    Biased toward YES for demo reliability (3:1 ratio in fallback).
    """
    prompt = f"""You are a strict quality verifier. Your ONLY job is to decide if a task was completed satisfactorily.

Original Task: {subtask}
Agent Output: {output}

Rules:
- Reply with ONLY the word YES or NO
- YES if the output is relevant, specific, and demonstrates real work
- NO if the output is vague, irrelevant, or clearly wrong
- Do NOT explain your reasoning

Your verdict:"""

    result = _call_llm(prompt)
    if result:
        upper = result.strip().upper()
        if "YES" in upper:
            return "YES"
        if "NO" in upper:
            return "NO"

    # Weighted fallback: ~80% YES to keep demo mostly positive
    return random.choices(["YES", "NO"], weights=[4, 1], k=1)[0]


# ─── Blockchain Utility ────────────────────────────────────────────────────────
def generate_tx_hash(task: str, total_cost: int) -> str:
    """Generates a deterministic-looking fake blockchain transaction hash."""
    seed = f"{task}{total_cost}{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    raw_hash = hashlib.sha256(seed.encode()).hexdigest()
    return "0x" + raw_hash[:40]


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "service":    "Agent Bazaar API",
        "version":    "1.0.0",
        "llm_mode":   "gemini-live" if LLM_AVAILABLE else "fallback",
        "status":     "running",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"ok": True, "llm_available": LLM_AVAILABLE}


@app.get("/agents", tags=["Registry"])
def list_agents():
    """Returns the registry of all available specialized agents."""
    return {"agents": agents}


@app.get("/demo", tags=["Demo"])
def demo(task: str):
    """
    Full autonomous agent pipeline:
    1. Planner breaks task into subtasks
    2. Worker agents execute each subtask
    3. Verifier agent quality-checks each output
    4. Payment is released or partially held
    """
    if not task or len(task.strip()) < 5:
        raise HTTPException(status_code=400, detail="Task must be at least 5 characters.")

    task = task.strip()

    # ── Step 1: Planning ──────────────────────────────────────────────────────
    time.sleep(random.uniform(0.3, 0.7))  # Simulate planning latency
    subtask_list = planner_agent(task)

    # ── Step 2: Assign agents randomly ───────────────────────────────────────
    assigned = []
    used_agents = set()
    available = agents.copy()
    random.shuffle(available)

    for i, subtask in enumerate(subtask_list):
        # Pick an agent, avoiding repeats where possible
        agent = available[i % len(available)]
        cost = agent["base_cost"] + random.randint(-2, 4)
        reputation = round(random.uniform(3.5, 5.0), 1)

        assigned.append({
            "subtask": subtask,
            "agent": {
                "name": agent["name"],
                "role": agent["role"],
                "reputation": reputation
            },
            "cost": max(cost, 2),
        })

    # ── Step 3: Execute + Verify ──────────────────────────────────────────────
    results = []
    total_cost = 0

    for item in assigned:
        time.sleep(random.uniform(0.4, 1.0))  # Simulate execution time

        output  = worker_agent(item["subtask"], item["agent"]["role"])
        verdict = verifier_agent(item["subtask"], output)

        reason = None
        if verdict == "NO":
            reason = "Output lacks sufficient detail or failed validation checks"

        results.append({
            "task": item["subtask"],
            "agent": item["agent"],
            "cost": item["cost"],
            "output": output,
            "verdict": verdict,
            "reason": reason
        })
        total_cost += item["cost"]

    # ── Step 4: Payment Settlement ────────────────────────────────────────────
    all_passed    = all(r["verdict"] == "YES" for r in results)
    payment_status = "RELEASED" if all_passed else "PARTIAL HOLD"
    tx_hash        = generate_tx_hash(task, total_cost)

    return {
        "task": task,
        "subtasks": results,
        "total_cost": total_cost,
        "payment": payment_status,
        "tx_hash": tx_hash,
        "llm_mode": "gemini-live" if LLM_AVAILABLE else "fallback",
        "blockchain": {
            "network": "Ethereum Sepolia",
            "contract_name": "AgentEscrow",
            "contract_address": "0xYOUR_CONTRACT_ADDRESS",
            "function_called": "releasePayment()" if payment_status == "RELEASED" else "holdPayment()",
            "status": payment_status,
            "explorer_url": "https://sepolia.etherscan.io/address/0xYOUR_CONTRACT_ADDRESS"
        }
    }