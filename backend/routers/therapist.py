from fastapi import APIRouter

router = APIRouter()

MOCK_PATIENTS = [
    {
        "id": "p1",
        "name": "Alex Johnson",
        "lastSession": "2026-08-04",
        "averageSuds": 65,
        "completedScenarios": 12,
        "progress": "improving"
    },
    {
        "id": "p2",
        "name": "Sam Smith",
        "lastSession": "2026-08-05",
        "averageSuds": 80,
        "completedScenarios": 3,
        "progress": "stagnant"
    },
    {
        "id": "p3",
        "name": "Jordan Lee",
        "lastSession": "2026-08-01",
        "averageSuds": 45,
        "completedScenarios": 25,
        "progress": "excellent"
    }
]

@router.get("/patients")
async def get_patients():
    return {"status": "success", "patients": MOCK_PATIENTS}
