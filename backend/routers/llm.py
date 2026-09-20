"""
FastAPI Router — /llm
Handles character roleplay and CBT report generation via Groq, Gemini, OpenAI, Anthropic, or Ollama.

Provider Fallback Priority (auto-selected based on available API keys):
  1. Ollama (local, zero-cost, no key needed — if running)
  2. Groq   (ultra-fast inference; uses production-only model list)
  3. Gemini (Google; requires GEMINI_API_KEY)
  4. OpenAI (requires OPENAI_API_KEY)
  5. Anthropic / Claude (requires ANTHROPIC_API_KEY)
  6. Rule-based mock (no LLM configured)

Groq Production Model Fallback Chain (as of Sept 2026 — decommissioned models removed):
  openai/gpt-oss-20b          — fast, efficient (primary)
  openai/gpt-oss-120b         — high reasoning (secondary)
  llama-3.3-70b-versatile     — general purpose production model
  llama-3.1-8b-instant        — ultra-fast fallback
  groq/compound-mini          — agentic compound system (single tool)

Decommissioned / do NOT use:
  - openai/gpt-oss (generic alias, unstable)
  - qwen/qwen3.6-27b (deprecated July 2025)
  - Mixtral 8x7B (deprecated March 2025)
  - Gemma 2 9B IT (deprecated August 2025)
  - Qwen-QwQ-32B (deprecated July 2025)
  - llama3-groq-*-tool-use-preview (deprecated Jan 2025)
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=backend_dir / ".env")
load_dotenv()

import httpx

try:
    from openai import (
        AsyncOpenAI,
        APIConnectionError,
        AuthenticationError,
        NotFoundError,
        APIStatusError,
        APIError
    )
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    APIConnectionError = AuthenticationError = NotFoundError = APIStatusError = APIError = Exception

import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    try:
        import google.generativeai as genai
        HAS_GEMINI = True
    except ImportError:
        HAS_GEMINI = False

router = APIRouter()

from config import settings

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", getattr(settings, "ollama_base_url", "http://localhost:11434"))
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", getattr(settings, "ollama_model", "llama3.1:8b"))
GROQ_MODEL = os.environ.get("GROQ_MODEL", getattr(settings, "groq_model", "openai/gpt-oss-20b"))

# Groq production model fallback chain — ONLY confirmed active production models.
# Preview/deprecated models intentionally excluded to prevent decommission crashes.
GROQ_FALLBACK_MODELS = [
    GROQ_MODEL,                   # env override (default: openai/gpt-oss-20b)
    "openai/gpt-oss-20b",         # fast, efficient — production
    "openai/gpt-oss-120b",        # high reasoning — production
    "llama-3.3-70b-versatile",    # general purpose — production
    "llama-3.1-8b-instant",       # ultra-fast — production
    "groq/compound-mini",         # agentic compound — production
]

def get_model_name(provider: str) -> str:
    if provider == "ollama":
        return OLLAMA_MODEL
    elif provider == "groq":
        return GROQ_MODEL
    elif provider == "gemini":
        return os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    elif provider == "anthropic":
        return os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
    else:
        return os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

def _ollama_is_running(timeout_seconds: float = 1.0) -> bool:
    try:
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout_seconds)
        return resp.status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False

def get_llm_client():
    """
    Auto-selects an LLM provider based on available keys/services.
    Priority: Ollama (local) → Groq → Gemini → OpenAI → Anthropic → None (mock)
    """
    # 1. Ollama — local, zero-cost, no key needed
    if HAS_OPENAI and _ollama_is_running():
        try:
            return AsyncOpenAI(
                api_key="ollama-local-no-key-needed",
                base_url=f"{OLLAMA_BASE_URL}/v1",
            ), "ollama"
        except Exception:
            pass

    # 2. Groq — ultra-fast inference, uses production-only fallback chain
    groq_key = os.environ.get("GROQ_API_KEY") or getattr(settings, "groq_api_key", "")
    if groq_key and HAS_OPENAI:
        try:
            return AsyncOpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1"
            ), "groq"
        except Exception:
            pass

    # 3. Gemini — Google AI, good for roleplay and structured JSON output
    gemini_key = os.environ.get("GEMINI_API_KEY") or getattr(settings, "gemini_api_key", "")
    if gemini_key and HAS_GEMINI:
        try:
            genai.configure(api_key=gemini_key)
            return genai, "gemini"
        except Exception:
            pass

    # 4. OpenAI — fallback for GPT-4o series
    openai_key = os.environ.get("OPENAI_API_KEY") or getattr(settings, "openai_api_key", "")
    if openai_key and HAS_OPENAI:
        try:
            return AsyncOpenAI(api_key=openai_key), "openai"
        except Exception:
            pass

    # 5. Anthropic Claude — final API fallback before mock
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY") or getattr(settings, "anthropic_api_key", "")
    if anthropic_key and HAS_OPENAI:
        try:
            # Anthropic supports OpenAI-compatible API format
            return AsyncOpenAI(
                api_key=anthropic_key,
                base_url="https://api.anthropic.com/v1"
            ), "anthropic"
        except Exception:
            pass

    # 6. No provider — mock responses will be used
    return None, None


class Message(BaseModel):
    role: str = "user"  # "user" | "assistant" | "system" | "ai"
    content: str = ""


class CharacterRequest(BaseModel):
    system_prompt: str
    messages: List[Message]
    stream: bool = True
    model: str = "gemini-1.5-pro"
    difficulty_level: Optional[int] = 1


class GenerateScenarioRequest(BaseModel):
    prompt: str


class ReportRequest(BaseModel):
    transcript: List[Message]
    distortion_events: List[dict]
    avoidance_events: List[dict]
    scenario_id: str
    difficulty_level: int


CBT_REPORT_PROMPT = """
You are a CBT-trained therapist reviewing a session transcript from a social anxiety training simulation.

Given the full transcript and distortion classifier outputs, produce a structured JSON report:

{
  "assertiveness_score": <1-10>,
  "assertiveness_rationale": "<2 sentences>",
  "session_insights": "<3-4 sentences, second person, compassionate>",
  "growth_note": "<1 sentence comparing to implied baseline>",
  "top_distortions": [
    {
      "key": "<distortion_key>",
      "label": "<human label>",
      "count": <int>,
      "avg_severity": <1.0-5.0>,
      "quotes": [
        {
          "text": "<exact quote from transcript>",
          "severity": <1-5>,
          "reframe": "<specific reframe using CBT technique, starting with 'Instead of...' or offering alternative perspective>"
        }
      ]
    }
  ],
  "avoidance_summary": "<2 sentences on avoidance patterns>",
  "three_action_steps": ["<specific step 1>", "<specific step 2>", "<specific step 3>"]
}

IMPORTANT: 
- Quote the user's EXACT words — do not paraphrase.
- Reframes should be compassionate, specific, and grounded in CBT.
- Assertiveness score reflects how directly and clearly the user communicated, not confidence.
- Be honest but never harsh.
"""


async def generate_mock_report(transcript, distortion_events):
    """Returns mock report structure for development without API key."""
    total = 0
    dist_counts = {}
    
    for evt in distortion_events:
        for d in evt.get("distortions", []):
            k = d.get("key")
            if k not in dist_counts:
                dist_counts[k] = {"key": k, "label": d.get("label", k), "count": 0, "sev_sum": 0, "quotes": []}
            dist_counts[k]["count"] += 1
            dist_counts[k]["sev_sum"] += d.get("severity", 1)
            dist_counts[k]["quotes"].append({
                "text": evt.get("message", "Unknown message"),
                "severity": d.get("severity", 1),
                "reframe": f"Try to view this from a more balanced perspective instead of {str(d.get('label') or 'this distortion').lower()}."
            })
            total += 1
            
    top_distortions = []
    for k, v in dist_counts.items():
        v["avg_severity"] = v["sev_sum"] / v["count"]
        top_distortions.append(v)
        
    top_distortions.sort(key=lambda x: x["count"], reverse=True)

    return {
        "assertiveness_score": 6 if total < 3 else 4,
        "assertiveness_rationale": "You stayed in the conversation which shows courage, though there's room to challenge automatic thoughts.",
        "session_insights": f"During this session, {total} cognitive distortions were detected. Identifying these is the first step toward restructuring them.",
        "growth_note": "You are making progress by simply bringing awareness to these patterns.",
        "top_distortions": top_distortions,
        "avoidance_summary": "No major avoidance detected, though keep an eye on deflecting or over-apologizing.",
        "three_action_steps": [
            "Review the specific quotes flagged in this report.",
            "Try generating your own reframes for those thoughts.",
            "Practice the same scenario again focusing on one specific distortion to avoid.",
        ],
    }


@router.post("/character")
async def character_response(req: CharacterRequest):
    """Stream character responses for live session."""
    client, provider = get_llm_client()

    if not client:
        async def mock_stream():
            import asyncio
            await asyncio.sleep(1.0)
            msg = "[SYSTEM: No API Key detected. Please set GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in the backend/.env file.]"
            for word in msg.split():
                yield f"data: {json.dumps({'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.05)
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    async def llm_stream():
        import asyncio
        import re
        delay = 1.0 if req.difficulty_level <= 2 else (3.0 if req.difficulty_level == 3 else 4.5)
        await asyncio.sleep(delay)

        system_instruction = (
            req.system_prompt +
            "\n\nCRITICAL ROLEPLAY CONSTRAINTS:\n"
            "1. You are roleplaying as a human character in a realistic exposure therapy simulation. Speak ONLY in direct, natural human spoken dialogue.\n"
            "2. Keep your response brief (1-3 spoken sentences maximum, ~15-40 words).\n"
            "3. NEVER output markdown headings (###), numbered lists, bullet points, code blocks, or project plans.\n"
            "4. NEVER break character, act as an AI assistant, or output internal thought/reasoning tags."
        )

        if provider in ["openai", "groq", "ollama", "anthropic"]:
            messages = [{"role": "system", "content": system_instruction}]
            formatted = []
            for m in req.messages:
                role = "assistant" if m.role in ["ai", "assistant"] else "user"
                formatted.append({"role": role, "content": m.content})

            if not formatted:
                messages.append({"role": "user", "content": "Hello. Start the interaction in character."})
            else:
                if formatted[0]["role"] == "assistant":
                    messages.append({"role": "user", "content": "Hello."})
                messages.extend(formatted)
                if messages[-1]["role"] != "user":
                    messages.append({"role": "user", "content": "Continue in character."})
            
            if provider == "groq":
                candidate_models = GROQ_FALLBACK_MODELS
            elif provider == "anthropic":
                # Anthropic claude models via their OpenAI-compatible endpoint
                candidate_models = [
                    get_model_name("anthropic"),
                    "claude-3-5-haiku-20241022",
                    "claude-3-haiku-20240307",
                ]
            else:
                candidate_models = [get_model_name(provider)]
            stream_success = False
            last_error = None

            for model_name in candidate_models:
                try:
                    stream = await client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        max_tokens=500,
                        temperature=0.85,
                        stream=True
                    )
                    in_think_block = False
                    think_buffer = ""
                    yielded_any = False
                    async for chunk in stream:
                        if not chunk.choices:
                            continue
                        delta = chunk.choices[0].delta.content or ""
                        if not delta:
                            continue

                        # Buffer and discard <think>...</think> blocks from stream
                        if "<think>" in delta or in_think_block:
                            in_think_block = True
                            think_buffer += delta
                            if "</think>" in think_buffer:
                                after_think = think_buffer.split("</think>", 1)[1]
                                in_think_block = False
                                think_buffer = ""
                                if after_think:
                                    yield f"data: {json.dumps({'delta': after_think})}\n\n"
                                    yielded_any = True
                            continue

                        if delta:
                            yield f"data: {json.dumps({'delta': delta})}\n\n"
                            yielded_any = True

                    if in_think_block and think_buffer and not yielded_any:
                        clean_buf = re.sub(r"<think>.*?(?:</think>|$)", "", think_buffer, flags=re.DOTALL).strip()
                        if clean_buf:
                            yield f"data: {json.dumps({'delta': clean_buf})}\n\n"

                    stream_success = True
                    break
                except Exception as e:
                    last_error = e
                    # If error is model not found or decommissioned, try next fallback
                    err_str = str(e).lower()
                    if "model_not_found" in err_str or "model_decommissioned" in err_str or "404" in err_str:
                        continue
                    else:
                        break

            if not stream_success:
                yield f"data: {json.dumps({'delta': f'[Error: {str(last_error)}]'})}\n\n"
            yield "data: [DONE]\n\n"
            
        elif provider == "gemini":
            # Set up Gemini
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
                system_instruction=req.system_prompt
            )
            
            chat_history = []
            for m in req.messages:
                role = "user" if m.role == "user" else "model"
                chat_history.append({"role": role, "parts": [m.content]})

            if not chat_history:
                chat_history.append({"role": "user", "parts": ["Hello. Start the interaction in character."]})
            elif chat_history[0]["role"] == "model":
                chat_history.insert(0, {"role": "user", "parts": ["Hello."]})
                
            try:
                # Stream the response
                response = model.generate_content(
                    chat_history,
                    stream=True,
                    generation_config={"temperature": 0.85, "max_output_tokens": 250}
                )
                
                for chunk in response:
                    if chunk.text:
                        # Gemini chunks can be larger, let's yield them
                        yield f"data: {json.dumps({'delta': chunk.text})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'delta': f'[Error: {str(e)}]'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(llm_stream(), media_type="text/event-stream")


@router.post("/report")
async def generate_report(req: ReportRequest):
    """Generate post-session CBT report."""
    client, provider = get_llm_client()

    transcript_text = "\n".join([
        f"{m.role.upper()}: {m.content}" for m in req.transcript
    ])
    distortion_summary = json.dumps(req.distortion_events, indent=2)

    # Note: we are currently using OpenAI, Groq, Ollama, or Gemini for JSON report generation
    if not client or provider not in ["openai", "groq", "ollama", "gemini", "anthropic"]:
        return await generate_mock_report(req.transcript, req.distortion_events)

    try:
        if provider == "gemini":
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
                system_instruction=CBT_REPORT_PROMPT
            )
            response = model.generate_content(
                f"TRANSCRIPT:\n{transcript_text}\n\nDISTORTION EVENTS:\n{distortion_summary}",
                generation_config={"temperature": 0.3, "response_mime_type": "application/json"}
            )
            raw_text = response.text
        else:
            if provider == "groq":
                candidate_models = GROQ_FALLBACK_MODELS
            elif provider == "anthropic":
                candidate_models = [
                    get_model_name("anthropic"),
                    "claude-3-5-haiku-20241022",
                    "claude-3-haiku-20240307",
                ]
            else:
                candidate_models = [get_model_name(provider)]
            raw_text = None
            last_error = None
            for model_name in candidate_models:
                try:
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": CBT_REPORT_PROMPT},
                            {"role": "user", "content": f"TRANSCRIPT:\n{transcript_text}\n\nDISTORTION EVENTS:\n{distortion_summary}"},
                        ],
                        temperature=0.3,
                        response_format={"type": "json_object"},
                    )
                    raw_text = response.choices[0].message.content
                    break
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    if "model_not_found" in err_str or "model_decommissioned" in err_str or "404" in err_str:
                        continue
                    else:
                        break

            if raw_text is None:
                raise last_error or Exception("All candidate models failed")
        
        # Clean up markdown code blocks if the model mistakenly included them
        clean_text = raw_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        import re
        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
        if match:
            clean_text = match.group(0)
            
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error generating report: {e}\nRaw Output: {response.choices[0].message.content if 'response' in locals() and response else 'None'}")
        return {"error": f"LLM failed to produce valid JSON: {str(e)}", "raw_output": response.choices[0].message.content if 'response' in locals() and response else 'None'}


@router.post("/generate-scenario")
async def generate_scenario(req: GenerateScenarioRequest):
    """Generate a custom CBT scenario based on user prompt."""
    import time
    client, provider = get_llm_client()
    
    # Fallback if no LLM configured
    if not client or provider not in ["openai", "groq", "ollama", "anthropic"]:
        return {
            "id": f"custom_{int(time.time())}",
            "name": "Custom AI Character",
            "scenario": "Custom Scenario",
            "domain": "custom",
            "icon": "✨",
            "identity": f"A generated persona based on: '{req.prompt}'",
            "vocab": "Natural conversational tone.",
            "levels": [
                {"level": 1, "label": "Cooperative and open to listening."},
                {"level": 2, "label": "Slightly guarded but engaged."},
                {"level": 3, "label": "Neutral, challenging some points."},
                {"level": 4, "label": "Skeptical, dismissive of concerns."},
                {"level": 5, "label": "Actively hostile or difficult."}
            ],
            "responseMap": {
                "User starts conversation": "Responds according to difficulty level."
            },
            "systemPrompt": f"You are a custom AI character generated based on: '{req.prompt}'. RULES: Respond directly to what the user says. Match the difficulty level. USER SAID: {{user_message}}. HISTORY: {{history}}. DIFFICULTY: {{level}} — {{level_desc}}"
        }

    prompt_instructions = f"""
    You are an expert CBT scenario designer for a social anxiety training app.
    The user needs to practice a specific upcoming stressful event.
    User prompt: "{req.prompt}"

    Generate a complete JSON object matching this schema for the character they will talk to:
    {{
      "id": "A unique lowercase snake_case string (e.g. 'custom_boss_sarah_123')",
      "name": "Name of the character",
      "scenario": "Short title of the scenario (e.g. 'Performance Review with Sarah')",
      "domain": "custom",
      "icon": "A single suitable emoji",
      "identity": "2-3 sentences describing who they are and their core personality trait",
      "vocab": "Short description of how they talk (e.g. 'Corporate buzzwords, passive aggressive')",
      "levels": [
        {{"level": 1, "label": "Cooperative and warm."}},
        {{"level": 2, "label": "Slightly guarded."}},
        {{"level": 3, "label": "Neutral, pushes back."}},
        {{"level": 4, "label": "Skeptical, dismissive."}},
        {{"level": 5, "label": "Hostile or very difficult."}}
      ],
      "responseMap": {{
        "User action description": "Character response description",
        "Another user action": "Another response"
      }},
      "systemPrompt": "You are [Name]... RULES: Respond to what they said... USER SAID: {{user_message}}. HISTORY: {{history}}. DIFFICULTY: {{level}} — {{level_desc}}"
    }}
    IMPORTANT: Do not wrap in markdown tags like ```json. Return raw valid JSON. Make sure the 'id' includes random numbers so it's unique.
    """

    try:
        if provider == "groq":
            candidate_models = GROQ_FALLBACK_MODELS
        elif provider == "anthropic":
            candidate_models = [
                get_model_name("anthropic"),
                "claude-3-5-haiku-20241022",
                "claude-3-haiku-20240307",
            ]
        else:
            candidate_models = [get_model_name(provider)]
        data = None
        last_error = None
        for model_name in candidate_models:
            try:
                response = await client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "system", "content": prompt_instructions}],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                data = json.loads(response.choices[0].message.content)
                break
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "model_not_found" in err_str or "model_decommissioned" in err_str or "404" in err_str:
                    continue
                else:
                    break

        if data is None:
            raise last_error or Exception("All candidate models failed")

        return data
    except Exception as e:
        print(f"Error generating custom scenario: {e}")
        return {"error": str(e), "traceback": "Check backend logs"}


