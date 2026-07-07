from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.db_models import Notification, Business
from backend.app.schemas.schemas import NotificationResponse
from backend.app.utils.auth import get_current_user, User
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    return db.query(Notification).filter(Notification.business_id == business.id).order_by(Notification.timestamp.desc()).all()

@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    notification = db.query(Notification).filter(
        Notification.id == notification_id, 
        Notification.business_id == business.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_notifications_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    db.query(Notification).filter(
        Notification.business_id == business.id, 
        Notification.read == False
    ).update({Notification.read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
