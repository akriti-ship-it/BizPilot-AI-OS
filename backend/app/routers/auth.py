from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.db_models import User, Business
from backend.app.schemas.schemas import UserCreate, UserResponse, Token
from backend.app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_pw = get_password_hash(user_data.password)
    
    # Create user
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        role=user_data.role or "admin"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default business for the user
    new_business = Business(
        user_id=new_user.id,
        name=f"{user_data.full_name or 'My'}'s Pilot Business",
        type="Retail",
        health_score=85,
        health_recommendations=["Review low stock warnings", "Analyze monthly revenue growth", "Verify pending purchase orders"]
    )
    db.add(new_business)
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "business": {
            "id": business.id if business else None,
            "name": business.name if business else "N/A",
            "type": business.type if business else "N/A",
            "health_score": business.health_score if business else 85,
            "health_recommendations": business.health_recommendations if business else []
        }
    }

from openai import OpenAI
from fastapi import Header
from typing import Optional

@router.post("/test-openai")
def test_openai_key(x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key")):
    if not x_openai_key:
        raise HTTPException(status_code=400, detail="API Key header 'X-OpenAI-Key' is missing")
    try:
        client = OpenAI(api_key=x_openai_key)
        client.models.list()
        return {"status": "success", "message": "OpenAI API Key verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OpenAI API Key validation failed: {str(e)}")
