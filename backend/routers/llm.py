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

# LLM client (lazy)
def get_llm_client():
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
    return {
        "assertiveness_score": 4,
        "assertiveness_rationale": "You communicated your ideas but frequently hedged and apologized unnecessarily. You stayed in the conversation which shows courage.",
        "session_insights": "Your main pattern was catastrophizing — assuming worst-case outcomes from ambiguous signals. The character's directness triggered mind-reading in you, leading you to assume negative judgments without evidence.",
        "growth_note": "You held your position longer before deflecting compared to an average first session.",
        "top_distortions": [],
        "avoidance_summary": "You deflected 2 times and over-apologized once. Avoidance is protective but prevents you from getting your needs met.",
        "three_action_steps": [
            "Before your next session, practice one sentence that states your position clearly without 'maybe' or 'I guess'.",
            "When you feel the urge to apologize, pause — ask yourself: 'Did I actually do something wrong?'",
            "Try the evidence-checking technique: list one fact that supports your catastrophic prediction, then one fact against it.",
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

        if provider in ["openai", "groq"]:
            messages = [{"role": "system", "content": req.system_prompt}]
            for m in req.messages:
                # Map frontend 'ai' role to standard 'assistant' role
                role = "assistant" if m.role == "ai" else m.role
                messages.append({"role": role, "content": m.content})
            
            # Use llama-3.3 for groq, gpt-4o for openai
            model_name = "llama-3.3-70b-versatile" if provider == "groq" else "gpt-4o"
            
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

    # Note: we are currently using OpenAI or Groq for JSON report generation
    if not client or provider not in ["openai", "groq"]:
        return await generate_mock_report(req.transcript, req.distortion_events)

    try:
        model_name = "llama-3.3-70b-versatile" if provider == "groq" else "gpt-4o"
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": CBT_REPORT_PROMPT},
                {"role": "user", "content": f"TRANSCRIPT:\n{transcript_text}\n\nDISTORTION EVENTS:\n{distortion_summary}"},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating report: {e}")
        return {"error": str(e), "traceback": "Check backend logs"}
