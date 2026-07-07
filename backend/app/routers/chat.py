from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.schemas import ChatRequest, ChatResponse
from backend.app.agents.coordinator import run_agent_workflow
from backend.app.utils.auth import get_current_user, User
from backend.app.models.db_models import Business
from typing import Optional

router = APIRouter(prefix="/api/chat", tags=["Chat & Agents"])

@router.post("/", response_model=ChatResponse)
def post_chat_message(
    request: ChatRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key")
):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    result = run_agent_workflow(request.message, business.id, db, x_openai_key)
    return ChatResponse(
        response=result["response"],
        agent_logs=result["agent_logs"],
        collaboration_graph=result["collaboration_graph"]
    )
