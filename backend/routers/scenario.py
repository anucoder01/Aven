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
    # For now, we just return a success since there is no DB.
    # In a real app, we would store this in a database and return the scenario ID.
    print(f"Received custom scenario for: {scenario.characterName}")
    return {"status": "success", "message": "Scenario created", "scenario": scenario}
