"""
FastAPI Router — /llm
Handles character roleplay and CBT report generation via OpenAI/Claude.
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

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

router = APIRouter()

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")

def _ollama_is_running(timeout_seconds: float = 1.0) -> bool:
    try:
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout_seconds)
        return resp.status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False

def get_llm_client():
    if HAS_OPENAI and _ollama_is_running():
        try:
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


class Message(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


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
        delay = 1.0 if req.difficulty_level <= 2 else (3.0 if req.difficulty_level == 3 else 4.5)
        await asyncio.sleep(delay)

        if provider in ["openai", "groq", "ollama"]:
            messages = [{"role": "system", "content": req.system_prompt}]
            for m in req.messages:
                # Map frontend 'ai' role to standard 'assistant' role
                role = "assistant" if m.role == "ai" else m.role
                messages.append({"role": role, "content": m.content})
            
            model_name = OLLAMA_MODEL if provider == "ollama" else ("llama-3.3-70b-versatile" if provider == "groq" else "gpt-4o")
            
            try:
                stream = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_tokens=250,
                    temperature=0.85,
                    stream=True
                )
                async for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield f"data: {json.dumps({'delta': delta})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'delta': f'[Error: {str(e)}]'})}\n\n"
            yield "data: [DONE]\n\n"
            
        elif provider == "gemini":
            # Set up Gemini
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                system_instruction=req.system_prompt
            )
            
            chat_history = []
            for m in req.messages:
                # Gemini roles are "user" and "model"
                role = "user" if m.role == "user" else "model"
                chat_history.append({"role": role, "parts": [m.content]})
                
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
    if not client or provider not in ["openai", "groq", "ollama", "gemini"]:
        return await generate_mock_report(req.transcript, req.distortion_events)

    try:
        if provider == "gemini":
            import google.generativeai as genai
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                system_instruction=CBT_REPORT_PROMPT
            )
            response = model.generate_content(
                f"TRANSCRIPT:\n{transcript_text}\n\nDISTORTION EVENTS:\n{distortion_summary}",
                generation_config={"temperature": 0.3, "response_mime_type": "application/json"}
            )
            raw_text = response.text
        else:
            model_name = OLLAMA_MODEL if provider == "ollama" else ("llama-3.3-70b-versatile" if provider == "groq" else "gpt-4o")
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
        print(f"Error generating report: {e}\nRaw Output: {response.choices[0].message.content if 'response' in locals() else 'None'}")
        return {"error": f"LLM failed to produce valid JSON: {str(e)}", "raw_output": response.choices[0].message.content if 'response' in locals() else 'None'}


@router.post("/generate-scenario")
async def generate_scenario(req: GenerateScenarioRequest):
    """Generate a custom CBT scenario based on user prompt."""
    import time
    client, provider = get_llm_client()
    
    # Fallback if no LLM configured
    if not client or provider not in ["openai", "groq", "ollama"]:
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
        model_name = OLLAMA_MODEL if provider == "ollama" else ("llama-3.3-70b-versatile" if provider == "groq" else "gpt-4o")
        response = await client.chat.completions.create(
            model=model_name,
            messages=[{"role": "system", "content": prompt_instructions}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        print(f"Error generating custom scenario: {e}")
        return {"error": str(e), "traceback": "Check backend logs"}

