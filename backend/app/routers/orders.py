from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.db_models import Order, Supplier, Customer, Business, Product, ActivityLog
from backend.app.schemas.schemas import OrderCreate, OrderResponse, SupplierCreate, SupplierResponse
from backend.app.utils.auth import get_current_user, User
from typing import List
import datetime

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("/", response_model=List[OrderResponse])
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    return db.query(Order).filter(Order.business_id == business.id).order_by(Order.id.desc()).all()

@router.post("/", response_model=OrderResponse)
def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    # Map items to dicts
    items_json = [item.dict() for item in order_data.items]
    
    new_order = Order(
        business_id=business.id,
        supplier_id=order_data.supplier_id,
        customer_id=order_data.customer_id,
        order_type=order_data.order_type,
        status="pending",
        total_amount=order_data.total_amount,
        items_json=items_json,
        order_date=datetime.datetime.utcnow()
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Log agent action
    agent = "Inventory Agent" if order_data.order_type == "purchase" else "Customer Support Agent"
    action_desc = f"Created new {order_data.order_type} order (ID: {new_order.id}) totaling ${order_data.total_amount:.2f}."
    db.add(ActivityLog(
        business_id=business.id,
        agent_name=agent,
        action_description=action_desc
    ))
    db.commit()
    
    return new_order

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    order = db.query(Order).filter(Order.id == order_id, Order.business_id == business.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_status = order.status
    new_status = status_data.get("status", old_status)
    order.status = new_status
    
    # If order is a purchase order and is marked completed, let's update our inventory stock levels!
    if order.order_type == "purchase" and old_status != "completed" and new_status == "completed":
        stock_updates = []
        for item in order.items_json:
            sku = item.get("product_sku")
            qty = item.get("quantity", 0)
            
            # Find product
            product = db.query(Product).filter(Product.sku == sku, Product.business_id == business.id).first()
            if product and product.inventory:
                old_stock = product.inventory.stock_level
                product.inventory.stock_level += qty
                product.inventory.last_updated = datetime.datetime.utcnow()
                stock_updates.append(f"{sku}: {old_stock} -> {product.inventory.stock_level}")
        
        # Log inventory replenishment
        if stock_updates:
            db.add(ActivityLog(
                business_id=business.id,
                agent_name="Inventory Agent",
                action_description=f"Purchase order PO-{order.id} marked completed. Replenishing stock: {', '.join(stock_updates)}."
            ))
            
    db.add(ActivityLog(
        business_id=business.id,
        agent_name="Executive Coordinator",
        action_description=f"Order PO-{order.id} status updated from '{old_status}' to '{new_status}'."
    ))
    db.commit()
    
    return {"message": "Order status updated successfully", "order_id": order.id, "status": order.status}

@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return db.query(Supplier).filter(Supplier.business_id == business.id).all()

@router.post("/suppliers", response_model=SupplierResponse)
def add_supplier(supplier_data: SupplierCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    new_supplier = Supplier(
        business_id=business.id,
        name=supplier_data.name,
        contact_email=supplier_data.contact_email,
        phone=supplier_data.phone,
        address=supplier_data.address
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier
