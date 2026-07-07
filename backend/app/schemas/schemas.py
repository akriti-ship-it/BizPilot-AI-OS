from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "admin"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Business Schemas
class BusinessBase(BaseModel):
    name: str
    type: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessResponse(BusinessBase):
    id: int
    user_id: int
    health_score: int
    health_recommendations: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    price: float
    cost: float
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    description: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    business_id: int
    created_at: datetime
    stock_level: Optional[int] = 0
    safety_threshold: Optional[int] = 10
    
    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryUpdate(BaseModel):
    stock_level: int
    safety_threshold: Optional[int] = None

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    business_id: int
    
    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    business_id: int
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderItem(BaseModel):
    product_sku: str
    quantity: int
    unit_price: float

class OrderCreate(BaseModel):
    supplier_id: Optional[int] = None
    customer_id: Optional[int] = None
    order_type: str # purchase, customer
    total_amount: float
    items: List[OrderItem]

class OrderResponse(BaseModel):
    id: int
    business_id: int
    supplier_id: Optional[int] = None
    customer_id: Optional[int] = None
    order_type: str
    status: str
    total_amount: float
    order_date: datetime
    items_json: Any
    
    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceResponse(BaseModel):
    id: int
    business_id: int
    customer_id: Optional[int] = None
    invoice_number: str
    amount: float
    status: str
    issue_date: datetime
    due_date: Optional[datetime] = None
    extracted_json: Optional[Any] = None
    file_url: Optional[str] = None
    
    class Config:
        from_attributes = True

# Report Schemas
class ReportResponse(BaseModel):
    id: int
    business_id: int
    title: str
    type: str
    content_json: Any
    created_at: datetime
    
    class Config:
        from_attributes = True

# ActivityLog Schemas
class ActivityLogResponse(BaseModel):
    id: int
    business_id: int
    agent_name: str
    action_description: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    agent_logs: List[Dict[str, Any]] # AI Action Timeline entries
    collaboration_graph: Dict[str, Any] # Active nodes and edges for visualization

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    business_id: int
    title: str
    message: str
    read: bool
    timestamp: datetime
    
    class Config:
        from_attributes = True

