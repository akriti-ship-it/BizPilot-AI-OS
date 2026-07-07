from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.db_models import Product, Inventory, Business, ActivityLog
from backend.app.schemas.schemas import ProductCreate, ProductResponse, ProductUpdate
from backend.app.utils.auth import get_current_user, User
from typing import List, Optional
import datetime

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/")
def get_inventory(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    query = db.query(Product).filter(Product.business_id == business.id)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
        
    if category and category != "All":
        query = query.filter(Product.category == category)
        
    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for p in products:
        stock = p.inventory.stock_level if p.inventory else 0
        safety = p.inventory.safety_threshold if p.inventory else 10
        result.append({
            "id": p.id,
            "business_id": p.business_id,
            "name": p.name,
            "sku": p.sku,
            "category": p.category,
            "price": p.price,
            "cost": p.cost,
            "description": p.description,
            "created_at": p.created_at,
            "stock_level": stock,
            "safety_threshold": safety
        })
        
    return {
        "products": result,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/", response_model=ProductResponse)
def add_product(product_data: ProductCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    # Check if SKU exists
    existing = db.query(Product).filter(Product.sku == product_data.sku, Product.business_id == business.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists in your inventory")
        
    new_product = Product(
        business_id=business.id,
        name=product_data.name,
        sku=product_data.sku,
        category=product_data.category,
        price=product_data.price,
        cost=product_data.cost,
        description=product_data.description
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Create associated Inventory entry
    new_inventory = Inventory(
        product_id=new_product.id,
        stock_level=0,
        safety_threshold=10
    )
    db.add(new_inventory)
    
    # Log agent action
    log = ActivityLog(
        business_id=business.id,
        agent_name="Inventory Agent",
        action_description=f"Added new product to catalog: '{new_product.name}' (SKU: {new_product.sku}). Initial stock level set to 0."
    )
    db.add(log)
    db.commit()
    
    return ProductResponse(
        id=new_product.id,
        business_id=new_product.business_id,
        name=new_product.name,
        sku=new_product.sku,
        category=new_product.category,
        price=new_product.price,
        cost=new_product.cost,
        description=new_product.description,
        created_at=new_product.created_at,
        stock_level=0,
        safety_threshold=10
    )

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Update fields
    for key, value in product_data.dict(exclude_unset=True).items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    
    stock = product.inventory.stock_level if product.inventory else 0
    safety = product.inventory.safety_threshold if product.inventory else 10
    
    return ProductResponse(
        id=product.id,
        business_id=product.business_id,
        name=product.name,
        sku=product.sku,
        category=product.category,
        price=product.price,
        cost=product.cost,
        description=product.description,
        created_at=product.created_at,
        stock_level=stock,
        safety_threshold=safety
    )

@router.put("/{product_id}/stock", response_model=ProductResponse)
def update_stock(product_id: int, stock_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    inventory = product.inventory
    if not inventory:
        inventory = Inventory(product_id=product.id, stock_level=0, safety_threshold=10)
        db.add(inventory)
        db.commit()
        db.refresh(inventory)
        
    old_stock = inventory.stock_level
    new_stock = stock_data.get("stock_level", old_stock)
    new_safety = stock_data.get("safety_threshold", inventory.safety_threshold)
    
    inventory.stock_level = new_stock
    inventory.safety_threshold = new_safety
    inventory.last_updated = datetime.datetime.utcnow()
    
    # Log agent action
    log = ActivityLog(
        business_id=business.id,
        agent_name="Inventory Agent",
        action_description=f"Stock updated for SKU {product.sku} ('{product.name}'): {old_stock} -> {new_stock} units. (Safety threshold: {new_safety})."
    )
    db.add(log)
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        business_id=product.business_id,
        name=product.name,
        sku=product.sku,
        category=product.category,
        price=product.price,
        cost=product.cost,
        description=product.description,
        created_at=product.created_at,
        stock_level=inventory.stock_level,
        safety_threshold=inventory.safety_threshold
    )

@router.delete("/{product_id}")
def delete_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    product = db.query(Product).filter(Product.id == product_id, Product.business_id == business.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Log agent action
    log = ActivityLog(
        business_id=business.id,
        agent_name="Inventory Agent",
        action_description=f"Removed product from catalog: '{product.name}' (SKU: {product.sku})."
    )
    db.add(log)
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}
