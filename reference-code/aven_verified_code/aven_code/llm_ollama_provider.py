"""
Drop-in replacement for get_llm_client() in backend/routers/llm.py.

Adds Ollama (free, local, no API key, no rate limit) as the FIRST-choice
provider, with a fast health check so it never hangs the request if Ollama
isn't running. Falls back to the existing Groq -> Gemini -> OpenAI chain
unchanged if Ollama is unavailable.

Requires: pip install httpx (already in requirements.txt)
"""

import os
import httpx

try:
    from openai import AsyncOpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")


def _ollama_is_running(timeout_seconds: float = 1.0) -> bool:
    """
    Fast, cheap health check -- avoids ever hanging a user-facing request
    waiting on a dead local server. 1 second timeout is enough for a
    localhost round-trip; if Ollama isn't up, this fails fast and falls
    through to the cloud fallback chain instead.
    """
    try:
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout_seconds)
        return resp.status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False


def get_llm_client():
    """
    Provider priority:
      1. Ollama (local, free, unlimited) -- if the server is reachable
      2. Groq (free tier, generous limits) -- existing behavior
      3. Gemini (free tier) -- existing behavior
      4. OpenAI (paid) -- existing behavior, last resort only
    """
    if HAS_OPENAI and _ollama_is_running():
        try:
            # Ollama exposes an OpenAI-compatible endpoint at /v1.
            # The API key is required by the client library but ignored
            # by Ollama itself -- any non-empty string works.
            return AsyncOpenAI(
                api_key="ollama-local-no-key-needed",
                base_url=f"{OLLAMA_BASE_URL}/v1",
            ), "ollama"
        except Exception:
            pass

    if os.environ.get("GROQ_API_KEY") and HAS_OPENAI:
        try:
            return AsyncOpenAI(
                api_key=os.environ.get("GROQ_API_KEY"),
                base_url="https://api.groq.com/openai/v1"
            ), "groq"
        except Exception:
            pass
    elif os.environ.get("GEMINI_API_KEY") and HAS_GEMINI:
        try:
            genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
            return genai, "gemini"
        except Exception:
            pass
    elif os.environ.get("OPENAI_API_KEY") and HAS_OPENAI:
        try:
            return AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY")), "openai"
        except Exception:
            pass

    return None, None


# ---------------------------------------------------------------------------
# Integration note for the "ollama"/"openai"/"groq" branch in llm.py's
# character_response() and generate_report(): Ollama's OpenAI-compatible
# endpoint accepts the exact same chat.completions.create() call shape as
# OpenAI/Groq. Just add "ollama" alongside "openai"/"groq" wherever llm.py
# checks `if provider in ["openai", "groq"]:` and set:
#     model_name = OLLAMA_MODEL if provider == "ollama" else (...)
# No other code changes needed -- this is intentionally a minimal diff.
# ---------------------------------------------------------------------------
