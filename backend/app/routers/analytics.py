from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.db_models import Order, Product, Inventory, Invoice, Business, ActivityLog
from backend.app.utils.auth import get_current_user, User
from typing import Dict, Any, List
import datetime
from sqlalchemy import func

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    # Calculate Total Revenue (completed sales orders and paid invoices)
    sales_orders_total = db.query(func.sum(Order.total_amount))\
        .filter(Order.business_id == business.id, Order.order_type == "customer", Order.status == "completed")\
        .scalar() or 0.0
        
    invoices_total = db.query(func.sum(Invoice.amount))\
        .filter(Invoice.business_id == business.id, Invoice.status == "paid")\
        .scalar() or 0.0
        
    total_revenue = sales_orders_total + invoices_total
    
    # Calculate Orders Count
    orders_count = db.query(Order).filter(Order.business_id == business.id).count()
    
    # Calculate Inventory Low Stock Count
    low_stock_count = 0
    products = db.query(Product).filter(Product.business_id == business.id).all()
    for p in products:
        if p.inventory and p.inventory.stock_level <= p.inventory.safety_threshold:
            low_stock_count += 1
            
    # Calculate Alerts Card Count
    alerts_count = low_stock_count
    pending_purchase_orders = db.query(Order).filter(
        Order.business_id == business.id, 
        Order.order_type == "purchase", 
        Order.status == "pending"
    ).count()
    alerts_count += pending_purchase_orders
    
    # Sales Trend and Revenue Trend (past 7 days) dynamically aggregated
    sales_trend = []
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        # Completed sales orders on this day
        day_orders_sum = db.query(func.sum(Order.total_amount))\
            .filter(
                Order.business_id == business.id,
                Order.order_type == "customer",
                func.date(Order.order_date) == day
            ).scalar() or 0.0
            
        # Paid invoices on this day
        day_invoices_sum = db.query(func.sum(Invoice.amount))\
            .filter(
                Invoice.business_id == business.id,
                Invoice.status == "paid",
                func.date(Invoice.issue_date) == day
            ).scalar() or 0.0
            
        sales_trend.append({
            "name": day_str,
            "Sales": float(day_orders_sum),
            "Revenue": float(day_orders_sum + day_invoices_sum)
        })
        
    # Dynamic fallback to seed data curves if database holds zero sales entries yet
    total_sales_trend = sum(item["Revenue"] for item in sales_trend)
    if total_sales_trend == 0:
        sales_trend = [
            {"name": (today - datetime.timedelta(days=6)).strftime("%b %d"), "Sales": 200, "Revenue": 150},
            {"name": (today - datetime.timedelta(days=5)).strftime("%b %d"), "Sales": 350, "Revenue": 280},
            {"name": (today - datetime.timedelta(days=4)).strftime("%b %d"), "Sales": 120, "Revenue": 90},
            {"name": (today - datetime.timedelta(days=3)).strftime("%b %d"), "Sales": 480, "Revenue": 400},
            {"name": (today - datetime.timedelta(days=2)).strftime("%b %d"), "Sales": 250, "Revenue": 200},
            {"name": (today - datetime.timedelta(days=1)).strftime("%b %d"), "Sales": 600, "Revenue": 550},
            {"name": today.strftime("%b %d"), "Sales": 150, "Revenue": 120}
        ]
    
    # Top Products
    top_products = []
    for p in products[:5]:
        top_products.append({
            "name": p.name,
            "sku": p.sku,
            "stock": p.inventory.stock_level if p.inventory else 0,
            "price": p.price,
            "sales": 120 # simulated sales quantity
        })
        
    if not top_products:
        top_products = [
            {"name": "Premium Coffee Beans", "sku": "COF-BEANS", "stock": 45, "price": 18.75, "sales": 150},
            {"name": "Paper Cups 12oz", "sku": "PPR-CUPS", "stock": 200, "price": 1.95, "sales": 320},
            {"name": "Syrup Vanilla 1L", "sku": "SYR-VAN", "stock": 5, "price": 14.50, "sales": 65}
        ]
        
    # Recent Activity
    logs = db.query(ActivityLog).filter(ActivityLog.business_id == business.id).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    recent_activity = []
    for l in logs:
        recent_activity.append({
            "id": l.id,
            "agent": l.agent_name,
            "action": l.action_description,
            "time": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    return {
        "metrics": {
            "revenue": total_revenue,
            "orders": orders_count,
            "low_stock": low_stock_count,
            "alerts": alerts_count
        },
        "sales_trend": sales_trend,
        "top_products": top_products,
        "recent_activity": recent_activity
    }

@router.get("/health-score")
def get_health_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    # Dynamically calculate health score based on operational indicators
    # Base is 85.
    score = 85
    recommendations = []
    
    # 1. Check low stock items
    products = db.query(Product).filter(Product.business_id == business.id).all()
    low_stock_items = []
    for p in products:
        if p.inventory and p.inventory.stock_level <= p.inventory.safety_threshold:
            low_stock_items.append(p)
            
    if len(low_stock_items) > 0:
        score -= min(15, len(low_stock_items) * 3)
        recommendations.append(f"Replenish low stock items: {', '.join([p.name for p in low_stock_items[:3]])}")
    else:
        recommendations.append("All inventory stock levels are healthy.")
        
    # 2. Check pending purchase orders (which means we are waiting for stock, good!) or overdue bills
    pending_po = db.query(Order).filter(
        Order.business_id == business.id,
        Order.order_type == "purchase",
        Order.status == "pending"
    ).count()
    if pending_po > 0:
        recommendations.append(f"You have {pending_po} pending replenishment orders. Follow up with suppliers.")
        
    # 3. Check unpaid invoices
    unpaid_invoices = db.query(Invoice).filter(
        Invoice.business_id == business.id,
        Invoice.status == "unpaid"
    ).all()
    if unpaid_invoices:
        score -= min(10, len(unpaid_invoices) * 2)
        recommendations.append(f"Follow up on {len(unpaid_invoices)} unpaid invoices to improve cash flow.")
    else:
        recommendations.append("No unpaid invoices on record.")
        
    # Minimum health score is 30
    score = max(30, min(100, score))
    
    # Update business model
    business.health_score = score
    business.health_recommendations = recommendations
    db.commit()
    
    return {
        "health_score": score,
        "recommendations": recommendations,
        "rating": "Excellent" if score >= 90 else "Good" if score >= 75 else "At Risk"
    }

@router.get("/ceo-briefing")
def get_ceo_briefing(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    # Get products, low stock list
    products = db.query(Product).filter(Product.business_id == business.id).all()
    low_stock = []
    for p in products:
        if p.inventory and p.inventory.stock_level <= p.inventory.safety_threshold:
            low_stock.append({
                "name": p.name,
                "sku": p.sku,
                "current_stock": p.inventory.stock_level,
                "threshold": p.inventory.safety_threshold
            })
            
    # Calculate revenue
    invoices_paid = db.query(func.sum(Invoice.amount)).filter(Invoice.business_id == business.id, Invoice.status == "paid").scalar() or 0.0
    orders_completed = db.query(func.sum(Order.total_amount)).filter(Order.business_id == business.id, Order.order_type == "customer", Order.status == "completed").scalar() or 0.0
    total_rev = invoices_paid + orders_completed
    
    # Unpaid invoices amount
    unpaid_amount = db.query(func.sum(Invoice.amount)).filter(Invoice.business_id == business.id, Invoice.status == "unpaid").scalar() or 0.0
    
    # CEO summary prompt response
    ai_actions = [
        "Inventory Agent: Low stock identified on Coffee Beans. PO-102 generated.",
        "Business Analyst: Calculated Business Health Score at 82/100. Cash flow positive.",
        "Customer Support: Drafted replies to 3 customer shipping status inquiries."
    ]
    
    return {
        "briefing_date": datetime.date.today().strftime("%B %d, %Y"),
        "business_name": business.name,
        "revenue_mtd": total_rev,
        "unpaid_receivables": unpaid_amount,
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock[:5],
        "business_health_score": business.health_score,
        "ai_actions_today": ai_actions,
        "recommended_decisions": [
            {"id": 1, "description": "Approve purchase order PO-102 for Coffee Beans to avoid stockout.", "action_type": "approve_po", "target_id": 102},
            {"id": 2, "description": "Send automated payment reminders for 2 overdue customer invoices.", "action_type": "send_reminders", "target_id": None}
        ]
    }
