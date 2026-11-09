import os
import mlflow
import logging
from openai import OpenAI
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()  # Load environment variables from .env file

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "ollama")
AGENT_MODEL_NAME = os.getenv("AGENT_MODEL_NAME", "qwen2.5:7b")
JUDGE_MODEL_NAME = os.getenv("JUDGE_MODEL_NAME", "llama3.1:8b")

def get_agent_llm(temperature: float = 0.0, json_mode: bool = False) -> ChatOpenAI:
  kwargs = { "response_format": { "type": "json_object" } } if json_mode else {}

  return ChatOpenAI(
    model=AGENT_MODEL_NAME,
    base_url=OLLAMA_BASE_URL,
    api_key=OLLAMA_API_KEY,
    temperature=temperature,
    model_kwargs=kwargs
  )

def get_openai_client() -> OpenAI:
  return OpenAI(
    base_url=OLLAMA_BASE_URL,
    api_key=OLLAMA_API_KEY
  )

def init_mlflow():
  logging.info("Initializing MLflow tracking...")
  mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:3333"))
  mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT_NAME", "VeriGraph"))
  mlflow.langchain.autolog(silent=True)
  logging.info("MLflow tracking initialized.")