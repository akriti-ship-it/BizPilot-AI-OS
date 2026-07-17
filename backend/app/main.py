from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.session import engine, Base
from backend.app.routers import auth, inventory, invoices, orders, reports, analytics, chat, notifications
from backend.app.models import db_models
from backend.app.database.session import SessionLocal
from backend.app.utils.auth import get_password_hash
import datetime

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BizPilot AI OS API", description="Backend API for BizPilot AI OS", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(invoices.router)
app.include_router(orders.router)
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(notifications.router)

# Seed Initial Data if database is empty
def seed_data():
    db = SessionLocal()
    try:
        # Check if users already seeded
        user_count = db.query(db_models.User).count()
        if user_count == 0:
            # Seed main admin user
            admin_user = db_models.User(
                email="admin@bizpilot.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="Alex CTO",
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Create business
            business = db_models.Business(
                user_id=admin_user.id,
                name="Java Brew Cafe",
                type="Cafe",
                health_score=88,
                health_recommendations=[
                    "Stock up on Premium Coffee Beans (currently at 5 bags, safety: 10).",
                    "Collect payment for invoice INV-2026-102 (due in 5 days).",
                    "Automate purchase order PO-102 verification."
                ]
            )
            db.add(business)
            db.commit()
            db.refresh(business)
            
            # Create suppliers
            supplier1 = db_models.Supplier(
                business_id=business.id,
                name="Global Coffee Distributors",
                contact_email="replenish@globalcoffee.com",
                phone="555-0122",
                address="404 Espresso Lane, Seattle WA"
            )
            supplier2 = db_models.Supplier(
                business_id=business.id,
                name="Eco-Paper Packaging Co",
                contact_email="sales@ecopaper.com",
                phone="555-0133",
                address="707 Pulp Road, Portland OR"
            )
            db.add(supplier1)
            db.add(supplier2)
            db.commit()
            db.refresh(supplier1)
            db.refresh(supplier2)
            
            # Create customers
            customer1 = db_models.Customer(
                business_id=business.id,
                name="Corporate Coffee Plan LLC",
                email="billing@corporatecoffee.com",
                phone="555-0911"
            )
            customer2 = db_models.Customer(
                business_id=business.id,
                name="Downtown Bakery",
                email="downtownbakery@gourmet.com",
                phone="555-0944"
            )
            db.add(customer1)
            db.add(customer2)
            db.commit()
            db.refresh(customer1)
            db.refresh(customer2)
            
            # Create products
            p1 = db_models.Product(
                business_id=business.id,
                name="Premium Coffee Beans",
                sku="COF-BEANS",
                category="Ingredients",
                price=18.75,
                cost=7.50,
                description="Organic medium-roasted dark Arabica coffee beans."
            )
            p2 = db_models.Product(
                business_id=business.id,
                name="Paper Cups 12oz",
                sku="PPR-CUPS",
                category="Packaging",
                price=1.95,
                cost=0.45,
                description="Biodegradable double-wall hot beverage cups."
            )
            p3 = db_models.Product(
                business_id=business.id,
                name="Syrup Vanilla 1L",
                sku="SYR-VAN",
                category="Ingredients",
                price=14.50,
                cost=4.80,
                description="Sweet vanilla flavoring syrup bottles."
            )
            db.add(p1)
            db.add(p2)
            db.add(p3)
            db.commit()
            db.refresh(p1)
            db.refresh(p2)
            db.refresh(p3)
            
            # Create inventories
            db.add(db_models.Inventory(product_id=p1.id, stock_level=5, safety_threshold=10)) # Critical
            db.add(db_models.Inventory(product_id=p2.id, stock_level=250, safety_threshold=50)) # Healthy
            db.add(db_models.Inventory(product_id=p3.id, stock_level=12, safety_threshold=5)) # Healthy
            
            # Create sales invoices
            inv1 = db_models.Invoice(
                business_id=business.id,
                customer_id=customer1.id,
                invoice_number="INV-2026-101",
                amount=450.00,
                status="paid",
                issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=10),
                due_date=datetime.datetime.utcnow() + datetime.timedelta(days=20),
                extracted_json={
                    "invoice_number": "INV-2026-101",
                    "amount": 450.00,
                    "items": [{"product_name": "Premium Coffee Beans", "quantity": 24, "unit_price": 18.75}]
                }
            )
            inv2 = db_models.Invoice(
                business_id=business.id,
                customer_id=customer2.id,
                invoice_number="INV-2026-102",
                amount=125.50,
                status="unpaid",
                issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=2),
                due_date=datetime.datetime.utcnow() + datetime.timedelta(days=5),
                extracted_json={
                    "invoice_number": "INV-2026-102",
                    "amount": 125.50,
                    "items": [{"product_name": "Syrup Vanilla 1L", "quantity": 8, "unit_price": 14.50}]
                }
            )
            db.add(inv1)
            db.add(inv2)
            
            # Create some Activity Logs
            db.add(db_models.ActivityLog(
                business_id=business.id,
                agent_name="Executive Coordinator",
                action_description="BizPilot AI OS initialized successfully for Cafe Business configuration."
            ))
            db.add(db_models.ActivityLog(
                business_id=business.id,
                agent_name="Inventory Agent",
                action_description="Scanned product catalog. Flagged 'COF-BEANS' as stock critical (5 units remaining)."
            ))
            db.add(db_models.ActivityLog(
                business_id=business.id,
                agent_name="Business Analyst",
                action_description="Calculated monthly revenue target progression. Growth trend positive (+12% MoM)."
            ))
            
            # Seed default notifications
            db.add(db_models.Notification(
                business_id=business.id,
                title="Critical Stock Warning",
                message="Premium Coffee Beans stock is below safety limits (5 remaining, safety limit is 10). Reorder recommended.",
                read=False
            ))
            
            db.commit()
    except Exception as e:
        print(f"Data seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

seed_data()

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Serve frontend static assets (CSS, JS, etc.) if built
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(frontend_dist_path):
    # Mount assets directory for JS/CSS files
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
        
    # Catch-all route to serve the React index.html for any frontend pages (SPA routing)
    @app.get("/{catchall:path}")
    def read_index(catchall: str):
        # Allow requests to specific root-level files like favicon.svg or icons.svg
        file_path = os.path.join(frontend_dist_path, catchall)
        if catchall and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html for SPA routes
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "service": "BizPilot AI OS",
            "description": "The AI Operating System for Small Businesses."
        }
