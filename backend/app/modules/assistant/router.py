"""Assistant Router — HTTP endpoints only."""
from fastapi import APIRouter, Depends

from app.modules.assistant.dependencies import get_assistant_service
from app.modules.assistant.schemas import UnderstandRequest, UnderstandResponse, VoiceRequest, VoiceResponse
from app.modules.assistant.service import AssistantService

router = APIRouter()


@router.post("/understand", response_model=UnderstandResponse)
async def understand(
    data: UnderstandRequest,
    service: AssistantService = Depends(get_assistant_service),
):
    """Guided-buying entry point: 'What are you looking for today?'"""
    return await service.understand(data)


@router.post("/voice", response_model=VoiceResponse)
async def voice(
    data: VoiceRequest,
    service: AssistantService = Depends(get_assistant_service),
):
    """Voice entry point — same pipeline as /understand, translated both ways."""
    return await service.process_voice(data)
