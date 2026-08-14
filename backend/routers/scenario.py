from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CustomScenario(BaseModel):
    characterName: str
    relationship: str
    setting: str
    goal: str
    difficulty: int

@router.post("/create")
async def create_custom_scenario(scenario: CustomScenario):
    print(f"Received custom scenario for: {scenario.characterName}")
    return {"status": "success", "message": "Scenario created", "scenario": scenario}
