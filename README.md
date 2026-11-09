# VeriGraph

An autonomous research and report synthesis agent built with LangGraph, FastAPI, and MLflow. VeriGraph pairs a cyclical self-correcting state graph with DuckDuckGo web search, structured critique loops, and an independent LLM-as-a-Judge evaluation system to produce grounded technical reports without unverified hallucinations.

The system features full lifecycle observability: node-by-node execution telemetry, real-time Server-Sent Events (SSE) streaming, a modern React/TypeScript studio, and automated metric logging to an MLflow tracking server.

---

## Table of Contents

- [Core Motivation](#core-motivation)
- [System Architecture](#system-architecture)
  - [LangGraph Cyclical State Machine](#langgraph-cyclical-state-machine)
  - [State Definition and Reducers](#state-definition-and-reducers)
  - [Node Breakdown and Responsibilities](#node-breakdown-and-responsibilities)
  - [Halting Guarantees and Cycle Safety](#halting-guarantees-and-cycle-safety)
- [Evaluation and Observability Engine](#evaluation-and-observability-engine)
  - [LLM-as-a-Judge Scoring Rubric](#llm-as-a-judge-scoring-rubric)
  - [MLflow Experiment Tracking](#mlflow-experiment-tracking)
  - [Offline Benchmark Suite](#offline-benchmark-suite)
- [Web Studio and Streaming Protocol](#web-studio-and-streaming-protocol)
  - [Server-Sent Events (SSE) Contract](#server-sent-events-sse-contract)
  - [Interactive Studio Interface](#interactive-studio-interface)
- [Project Layout](#project-layout)
- [Local Setup Guide](#local-setup-guide)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Model Setup with Ollama](#2-model-setup-with-ollama)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. MLflow Tracking Server](#4-mlflow-tracking-server)
  - [5. Backend API Service](#5-backend-api-service)
  - [6. Frontend Web Studio](#6-frontend-web-studio)
  - [7. Running with Docker Compose](#7-running-with-docker-compose)
  - [8. Running the Offline Benchmark](#8-running-the-offline-benchmark)
- [Key Engineering Decisions](#key-engineering-decisions)
- [License](#license)

---

## Core Motivation

Standard Retrieval-Augmented Generation (RAG) and linear prompt chains suffer from two fundamental failure modes when answering complex technical questions:

1. **Single-shot retrieval failure**: If the initial search query is suboptimal or missing critical context, the downstream model has no opportunity to realize its evidence is thin. It either answers incompletely or fills gaps with convincing hallucinations.
2. **Lack of systematic quality auditing**: Without an automated evaluation step comparing the generated output against retrieved evidence, regressions in prompting or model upgrades go unnoticed until users encounter inaccuracies.

VeriGraph treats research as a closed-loop control system. Rather than relying on a single retrieval step, the workflow passes through an autonomous **Planner -> Researcher -> Critic** loop. If the Critic determines that the evidence is insufficient to satisfy the prompt, it rejects the current evidence pool, provides diagnostic feedback, and routes the agent back to the Planner for refined search queries.

Once evidence is validated, a Synthesizer builds a referenced technical report, followed by an independent **Judge** node that audits the report against the evidence pool across Faithfulness, Relevance, and Clarity criteria.

---

## System Architecture

### LangGraph Cyclical State Machine

The core execution graph is built as a compiled `StateGraph` in `src/verigraph/agent/graph.py`.

```
               +--------------------------------------------+
               |                                            |
               v                                            |
[START] -> [Planner] -> [Researcher] -> [Critic] --(False)--+
                                           |
                                        (True or >= 3 loops)
                                           |
                                           v
                                    [Synthesizer]
                                           |
                                           v
                                        [Judge] -> [END]
```

### State Definition and Reducers

All state mutations occur inside a centralized `AgentState` TypedDict defined in `src/verigraph/agent/state.py`:

```python
class AgentState(TypedDict):
    task: str                                           # Original user inquiry
    current_query: str                                  # Active search query formulated by Planner
    research_notes: Annotated[List[str], operator.add]  # Monotonic append-only evidence pool
    critique_feedback: str                              # Constructive critique from Critic node
    is_sufficient: bool                                 # Binary threshold flag from Critic
    revision_count: int                                 # Loop counter to enforce cycle limit
    final_report: str                                   # Grounded Markdown document
    judge_evaluation: Dict[str, Any]                    # Scorecard produced by LLM-as-a-Judge
```

Notice the use of `Annotated[List[str], operator.add]` for `research_notes`. In LangGraph, this specifies an append reducer: each execution of the Researcher appends fresh evidence to the historical evidence list rather than overwriting previous discoveries.

### Node Breakdown and Responsibilities

#### 1. Planner Node (`planner_node`)
- **Model Role**: Query formulation engine.
- **Parameters**: `temperature=0.2`.
- **Logic**: Inspects `state["task"]` and any prior `state["critique_feedback"]`. Compiles a concise 3 to 6 word search string stripped of conversational filler. On revision cycles, it incorporates the Critic's specific feedback to target missing angles.
- **Output Diff**: Updates `current_query` and increments `revision_count`.

#### 2. Researcher Node (`researcher_node`)
- **Model Role**: Tool-calling coordinator.
- **Tool**: `web_search_tool` using DuckDuckGo Search (`ddgs`).
- **Resilience**: If a search query is too narrow and yields 0 hits, the tool automatically falls back to the leading six keywords to avoid empty retrievals.
- **Output Diff**: Appends formatted strings containing `[snippet, title, link]` into `research_notes`.

#### 3. Critic Node (`critic_node`)
- **Model Role**: Quality gatekeeper.
- **Parameters**: `temperature=0.0` with `json_object` enforcement.
- **Validation**: Enforces the `CritiqueGrade` schema (`is_sufficient: bool`, `feedback: str`). It inspects the accumulated research notes against the user prompt to verify whether concrete facts, numbers, or technical details are present.
- **Output Diff**: Updates `is_sufficient` and `critique_feedback`.

#### 4. Synthesizer Node (`synthesizer_node`)
- **Model Role**: Technical analyst and technical writer.
- **Parameters**: `temperature=0.3`.
- **Grounding Rule**: The system prompt strictly prohibits speculation outside the provided research notes and enforces inline markdown citations linking back to retrieved URLs.
- **Output Diff**: Produces `final_report`.

#### 5. Judge Node (`judge_node`)
- **Model Role**: Independent quality auditor.
- **Parameters**: `temperature=0.0` with `json_object` enforcement.
- **Logic**: Executes `evaluate_report_with_judge(...)` to grade the synthesized report against both the initial prompt and the raw evidence chunks.
- **Output Diff**: Writes `judge_evaluation` containing numerical scores and structured explanations.

### Halting Guarantees and Cycle Safety

Autonomous loops risk entering infinite cycles if an agent repeatedly fails its own criteria. VeriGraph mitigates this via the conditional edge `route_after_critic`:

```python
MAX_REVISIONS = 3

def route_after_critic(state: AgentState) -> Literal["planner", "synthesizer"]:
    if state.get("is_sufficient", False) or state.get("revision_count", 0) >= MAX_REVISIONS:
        return "synthesizer"
    return "planner"
```

The loop halts when either:
1. The Critic verifies that collected evidence is sufficient (`is_sufficient == True`).
2. The agent hits the hard cutoff of 3 revision attempts (`revision_count >= 3`). If the cutoff is reached, the agent proceeds to the Synthesizer with the best available evidence rather than hanging indefinitely.

---

## Evaluation and Observability Engine

### LLM-as-a-Judge Scoring Rubric

The evaluation framework in `src/verigraph/evaluation/judge.py` uses an independent LLM prompt validated against a Pydantic `JudgeScorecard` schema:

| Metric | Range | Description |
| :--- | :--- | :--- |
| **Faithfulness** | 1 to 5 | Measures whether every factual claim in the report is grounded in the retrieved research notes. A score of 1 indicates severe hallucination, while 5 confirms 100% evidentiary backing. |
| **Relevance** | 1 to 5 | Measures how directly and thoroughly the report addresses the specific requirements of the user task. |
| **Clarity** | 1 to 5 | Measures document structure, tone, Markdown formatting, and readability. |
| **Overall Score** | 1.0 to 5.0 | Unweighted arithmetic mean of Faithfulness, Relevance, and Clarity. |

The Judge also outputs a `reasoning` string detailing why points were deducted, identifying any claims that lacked supporting notes.

### MLflow Experiment Tracking

Every research request triggers an active MLflow run (`VeriGraph-<run_id_short>`) configured in `src/verigraph/main.py`:

- **Parameters Logged**: `task`, `agent_model`, `judge_model`.
- **Metrics Logged**:
  - `total_latency_sec` (Execution wall time)
  - `revision_loops` (Total cycles through Critic)
  - `judge_faithfulness` (1 to 5)
  - `judge_relevance` (1 to 5)
  - `judge_clarity` (1 to 5)
  - `judge_overall` (Average composite score)
- **Artifacts Logged**:
  - `final_report.md`: The complete markdown output.
  - `judge_scorecard.json`: Structured JSON containing all scores and the judge's diagnostic rationale.

### Offline Benchmark Suite

`scripts/run_benchmark.py` provides an automated batch evaluation script for CI/CD regression testing or model comparisons:

- Uses `pandas` to construct test sets of complex technical queries.
- Runs queries across the compiled `agent_graph`.
- Wraps the judge with `mlflow.metrics.make_metric(faithfulness_metric_fn)`.
- Invokes `mlflow.evaluate()` to produce aggregate performance tables (e.g. mean faithfulness across test runs) viewable inside the MLflow UI.

---

## Web Studio and Streaming Protocol

### Server-Sent Events (SSE) Contract

The backend exposes an asynchronous streaming endpoint at `POST /api/research/stream`. Rather than returning a monolithic response after 30 seconds, it streams events in real time using `sse-starlette`:

1. `run_started`: Emits the initial MLflow Run ID.
2. `node_update`: Emitted whenever any LangGraph node finishes execution. Payload contains:
   - `node`: Name of the completed node (`planner`, `researcher`, `critic`, `synthesizer`, `judge`).
   - `update`: State dictionary produced by that node.
   - `revision_count`: Current revision count.
3. `completed`: Emits total runtime latency in seconds and final confirmation.

The frontend client in `src/web/src/api.ts` implements a resilient chunk decoder using the native `ReadableStream` API, correctly parsing multibyte boundaries and custom event types.

### Interactive Studio Interface

The web application (`src/web`) is built with React 19, TypeScript, Vite, Tailwind CSS v4, and Actify (Material Design 3):

- **Pipeline Stepper Ribbon**: Shows the five node steps horizontally with live status badges (`Running`, `Looping`, `Completed`, `Pending`).
- **Telemetry and Transition Feed**: Chronological terminal log showing every state diff, DuckDuckGo query string, and timestamp.
- **Verified Report Viewer**: Full Markdown renderer with calculated reading time, word count, one-click clipboard copy, and `.md` file download.
- **Quality Audit Card**: Visual score gauges for Faithfulness, Relevance, and Clarity, complete with the Judge's diagnostic explanation.
- **Grounding Evidence Hub**: Chronological list of raw scraped evidence chunks with source URLs and past Critic review decisions.
- **LangGraph DAG Visualizer**: Interactive diagram of the 5 nodes and conditional loop edge, allowing developers to click any node to inspect its execution logs and raw JSON state.
- **State Diff Inspector**: Live JSON tree showing accumulated state properties.

---

## Project Layout

```
verigraph/
├── pyproject.toml               # Python project configuration (uv build backend)
├── uv.lock                      # Deterministic Python dependency lockfile
├── compose.yml                  # Docker Compose configuration for MLflow and services
├── Dockerfile.verigraph         # Backend container definition (Python 3.13-slim + uv)
├── Dockerfile.web               # Frontend multi-stage container (Node 26 + Nginx Alpine)
├── .env.example                 # Template for environment variables
├── scripts/
│   └── run_benchmark.py         # Offline batch evaluation and MLflow benchmarking
├── src/
│   ├── verigraph/               # Core Python package
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application and SSE streaming endpoint
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Environment variables, LLM factories, MLflow setup
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── state.py         # TypedDict state and list reducers
│   │   │   ├── tools.py         # DuckDuckGo search tool with query fallbacks
│   │   │   ├── nodes.py         # Planner, Researcher, Critic, Synthesizer nodes
│   │   │   └── graph.py         # LangGraph workflow definition and conditional edges
│   │   └── evaluation/
│   │       ├── __init__.py
│   │       └── judge.py         # LLM-as-a-Judge implementation and scoring rubric
│   └── web/                     # React + TypeScript frontend
│       ├── package.json
│       ├── vite.config.ts
│       ├── nginx.conf           # Production Nginx reverse-proxy configuration
│       └── src/
│           ├── api.ts           # Fetch-based SSE parser
│           ├── types.ts         # TypeScript interfaces for scorecards and telemetry
│           ├── hooks/
│           │   └── useVerigraphStream.ts # Central React state hook for live streams
│           ├── components/
│           │   ├── common/      # MarkdownRenderer with syntax highlighting
│           │   ├── evaluation/  # JudgeScorecard visualization
│           │   ├── evidence/    # EvidenceViewer and critique history
│           │   ├── graph/       # GraphDAGViewer interactive state machine
│           │   ├── layout/      # Studio Header and status indicators
│           │   ├── pipeline/    # PipelineStepper ribbon
│           │   ├── query/       # QueryInputCard with preset prompts
│           │   ├── report/      # ReportViewer with export tools
│           │   └── trace/       # Real-time telemetry feed
│           └── pages/
│               └── index.tsx    # Split-pane production studio workspace
```

---

## Local Setup Guide

### 1. Prerequisites

- **Python**: Version 3.13 or higher.
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (recommended) or standard `pip`.
- **Node.js**: Version 20 or higher, with `npm`.
- **LLM Provider**: [Ollama](https://ollama.com/) running locally (or any OpenAI-compatible API endpoint).
- **Docker**: Optional, for running MLflow and containerized services.

### 2. Model Setup with Ollama

VeriGraph uses local models by default via Ollama's OpenAI-compatible `/v1` endpoint.

Start the Ollama server:

```bash
ollama serve
```

Pull the recommended models for agent planning and judge evaluation:

```bash
# Agent model for planning, searching, and synthesizing
ollama pull llama3.1:8b

# Alternative high-performing agent model
ollama pull qwen2.5:7b
```

### 3. Environment Configuration

Copy the example environment configuration into `.env`:

```bash
cp .env.example .env
```

Configure the variables to match your local setup:

```ini
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_API_KEY="ollama"
AGENT_MODEL_NAME="llama3.1:8b"
JUDGE_MODEL_NAME="llama3.1:8b"
MLFLOW_TRACKING_URI="http://127.0.0.1:3333"
MLFLOW_EXPERIMENT_NAME="VeriGraph"
```

### 4. MLflow Tracking Server

Run MLflow using Docker Compose:

```bash
docker compose up -d mlflow
```

This launches the tracking server on `http://127.0.0.1:3333` backed by a persistent SQLite database and local artifact store inside the `mlflow_data` volume.

Alternatively, if you prefer running MLflow locally without Docker:

```bash
uv run mlflow server --host 127.0.0.1 --port 3333
```

### 5. Backend API Service

Install dependencies using `uv`:

```bash
uv sync
```

Start the FastAPI backend with Uvicorn:

```bash
uv run uvicorn verigraph.main:app --host 0.0.0.0 --port 8080 --reload
```

Verify that the backend is healthy:

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "agent_model": "llama3.1:8b",
  "judge_model": "llama3.1:8b"
}
```

### 6. Frontend Web Studio

In a new terminal window, navigate to the web directory and install dependencies:

```bash
cd src/web
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The web studio will be running at `http://localhost:5173`. Open your browser and select any preset prompt or enter your own technical research inquiry.

*Note: By default, the frontend connects to `http://localhost:8080`. To point to a custom backend address, create `src/web/.env` with `VITE_API_BASE=http://your-host:your-port`.*

### 7. Running with Docker Compose

To run the MLflow tracking server and verify container builds:

```bash
# Start MLflow
docker compose up -d mlflow

# Build the backend image
docker build -t verigraph-backend -f Dockerfile.verigraph .

# Build the frontend image
docker build -t verigraph-frontend -f Dockerfile.web .
```

### 8. Running the Offline Benchmark

To run an automated evaluation run across the test dataset:

```bash
uv run python scripts/run_benchmark.py
```

This invokes each test prompt through the compiled LangGraph agent, runs the judge node, and logs aggregate metric values to your MLflow experiment. Open `http://127.0.0.1:3333` to compare runs side by side.

---

## Key Engineering Decisions

### Why LangGraph over Linear LangChain Chains
Linear chains execute in a single forward pass without conditional branches. If an LLM produces an inadequate search query or fetches irrelevant pages, a linear chain has no mechanism to recover. LangGraph provides first-class state persistence, cyclic conditional edges, and explicit state reducers. This makes it possible to model iterative loops where agents self-correct before presenting an answer to the user.

### Why TypedDict with Reducers
Managing unstructured conversational message histories quickly bloats context windows and complicates structured reasoning. By defining an explicit `AgentState` schema with typed fields (`task`, `current_query`, `research_notes`, `critique_feedback`, `is_sufficient`), each node only mutates the state slice it owns. Appending evidence via `operator.add` preserves chronological discovery without overwriting past attempts.

### Why Server-Sent Events (SSE) over WebSockets
Research runs can take anywhere from 10 to 45 seconds depending on model size and the number of critique loops. While WebSockets require bidirectional connection handshakes and heartbeats, research generation is strictly a server-to-client streaming problem. SSE provides standard HTTP streaming that works seamlessly over standard proxies, automatically reconnects, and parses cleanly into structured JSON events.

### Impartial Quality Auditing (LLM-as-a-Judge)
Relying solely on lexical metrics (like ROUGE or BLEU) fails when evaluating complex research reports because phrasing differs drastically across valid summaries. VeriGraph evaluates semantic grounding using a rubric-driven LLM-as-a-Judge step. Separating the generation prompt (Synthesizer) from the evaluation prompt (Judge) with temperature 0.0 and schema validation gives reliable, reproducible scores for automated tracking in MLflow.

---

## License

This project is licensed under the Apache 2.0 License.
