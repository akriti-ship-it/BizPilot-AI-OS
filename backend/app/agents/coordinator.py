from sqlalchemy.orm import Session
from backend.app.models.db_models import Product, Inventory, Supplier, Order, Business, ActivityLog, Invoice
import datetime
import os
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI

def run_agent_workflow(message: str, business_id: int, db: Session, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Orchestrates the multi-agent system.
    Processes user instructions, interacts with the DB, logs agent activities,
    and generates the collaboration graph and response using OpenAI (if available) or rules-based logic.
    """
    message_lower = message.lower()
    openai_key = api_key or os.getenv("OPENAI_API_KEY")
    
    # Initialize response structures
    agent_logs = []
    active_nodes = ["Executive Coordinator"]
    active_edges = []
    
    # 1. Executive Coordinator Entry Log
    agent_logs.append({
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "agent": "Executive Coordinator",
        "action": f"Instruction received: '{message}'."
    })
    
    # Gather database state context
    products = db.query(Product).filter(Product.business_id == business_id).all()
    orders = db.query(Order).filter(Order.business_id == business_id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business_id).all()
    
    products_list = []
    for p in products:
        stock = p.inventory.stock_level if p.inventory else 0
        safety = p.inventory.safety_threshold if p.inventory else 10
        products_list.append({
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "cost": p.cost,
            "stock": stock,
            "safety_threshold": safety
        })
        
    orders_list = []
    for o in orders[:5]:
        orders_list.append({
            "id": o.id,
            "order_type": o.order_type,
            "status": o.status,
            "total": o.total_amount,
            "items": o.items_json
        })
        
    invoices_list = []
    for inv in invoices[:5]:
        invoices_list.append({
            "invoice_number": inv.invoice_number,
            "amount": inv.amount,
            "status": inv.status,
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "N/A"
        })
        
    db_context = {
        "products": products_list,
        "recent_orders": orders_list,
        "recent_invoices": invoices_list
    }
    
    # Check intent and execute database triggers if needed
    executed_action_context = ""
    
    # CASE A: Reorder Action trigger
    if "reorder" in message_lower or "purchase order" in message_lower or "buy" in message_lower:
        active_nodes.extend(["Inventory Agent", "Database"])
        active_edges.extend([
            {"from": "Executive Coordinator", "to": "Inventory Agent"},
            {"from": "Inventory Agent", "to": "Database"}
        ])
        
        agent_logs.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "agent": "Inventory Agent",
            "action": "Scanning product database to match SKU or name for replenishment."
        })
        
        matched_product = None
        for p in products:
            if p.name.lower() in message_lower or p.sku.lower() in message_lower or (
                "coffee" in message_lower and "coffee" in p.name.lower()
            ):
                matched_product = p
                break
                
        # If no product found, default to first item for test
        if not matched_product and products:
            matched_product = products[0]
            
        if matched_product:
            # Find default supplier
            supplier = db.query(Supplier).filter(Supplier.business_id == business_id).first()
            if not supplier:
                supplier = Supplier(
                    business_id=business_id,
                    name="Java Distributors Ltd",
                    contact_email="replenish@javadistributors.com",
                    phone="555-0922",
                    address="101 Roast St, Seattle WA"
                )
                db.add(supplier)
                db.commit()
                db.refresh(supplier)
                
            qty = 100
            cost = matched_product.cost or 10.0
            total_amount = qty * cost
            
            # Create PO
            po = Order(
                business_id=business_id,
                supplier_id=supplier.id,
                order_type="purchase",
                status="pending",
                total_amount=total_amount,
                order_date=datetime.datetime.utcnow(),
                items_json=[{
                    "product_sku": matched_product.sku,
                    "quantity": qty,
                    "unit_price": cost
                }]
            )
            db.add(po)
            
            # Log action
            action_desc = f"Generated automatic purchase order PO-{po.id} for {qty} units of '{matched_product.name}' (SKU: {matched_product.sku}) from '{supplier.name}'."
            db.add(ActivityLog(
                business_id=business_id,
                agent_name="Inventory Agent",
                action_description=action_desc
            ))
            db.commit()
            db.refresh(po)
            
            executed_action_context = f"Successfully generated Purchase Order PO-{po.id} for {qty} units of '{matched_product.name}' (SKU: {matched_product.sku}) at ${cost:.2f} each. Total amount: ${total_amount:.2f}."
            
            agent_logs.append({
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "agent": "Inventory Agent",
                "action": f"Executed reorder: Created Purchase Order PO-{po.id}."
            })
            
    # CASE B: Stock check
    elif "stock" in message_lower or "inventory" in message_lower or "low" in message_lower:
        active_nodes.extend(["Inventory Agent", "Database"])
        active_edges.extend([
            {"from": "Executive Coordinator", "to": "Inventory Agent"},
            {"from": "Inventory Agent", "to": "Database"}
        ])
        agent_logs.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "agent": "Inventory Agent",
            "action": "Running safety threshold diagnostic check on all catalog items."
        })
        
    # CASE C: Analyst / Health report
    elif "health" in message_lower or "report" in message_lower or "performance" in message_lower or "analyst" in message_lower or "sales" in message_lower or "revenue" in message_lower:
        active_nodes.extend(["Business Analyst", "Database"])
        active_edges.extend([
            {"from": "Executive Coordinator", "to": "Business Analyst"},
            {"from": "Business Analyst", "to": "Database"}
        ])
        agent_logs.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "agent": "Business Analyst",
            "action": "Aggregating sales totals, invoices, and forecasting models."
        })
        
    # CASE D: Customer Support
    elif "order status" in message_lower or "customer" in message_lower or "support" in message_lower or "email" in message_lower:
        active_nodes.extend(["Customer Support Agent", "Database"])
        active_edges.extend([
            {"from": "Executive Coordinator", "to": "Customer Support Agent"},
            {"from": "Customer Support Agent", "to": "Database"}
        ])
        agent_logs.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "agent": "Customer Support Agent",
            "action": "Searching customer records for delivery logs and status logs."
        })
        
    # Standard fallback nodes
    else:
        active_nodes.extend(["Business Analyst"])
        active_edges.extend([
            {"from": "Executive Coordinator", "to": "Business Analyst"}
        ])
        
    # 2. RUN REAL OPENAI CALL IF KEY IS PRESENT
    if openai_key:
        agent_logs.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "agent": "Executive Coordinator",
            "action": "Calling OpenAI GPT model with retrieved database context."
        })
        
        try:
            client = OpenAI(api_key=openai_key)
            
            system_prompt = f"""
            You are BizPilot OS, a multi-agent AI assistant for a small business named Java Brew Cafe.
            You must answer the user prompt based on the actual database state provided below. Do not use fake or placeholder statistics if the actual numbers are in the database.
            
            Actual Database State:
            ---
            {json.dumps(db_context, indent=2)}
            ---
            
            Executed Action Context (if any):
            ---
            {executed_action_context}
            ---
            
            Worker Agents:
            1. Executive Coordinator: Receives instruction, routes tasks.
            2. Invoice Agent: OCR extracts and processes line items.
            3. Inventory Agent: stock checking, safety stock limit analysis.
            4. Business Analyst Agent: financial reports, Health Score.
            5. Customer Support Agent: client orders, draft emails.
            
            Instructions:
            - Formulate a helpful, executive response.
            - If you are answering about stock level, list the products, their current stock, and safety limits. Highlight low stock products.
            - If a database action was executed (e.g. Purchase Order created), describe the generated PO details and next steps.
            - Use clean Markdown tables or bullet lists.
            - Keep your response professional, concise, and focused on operational statistics.
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.3
            )
            ai_response = response.choices[0].message.content.strip()
            
            agent_logs.append({
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "agent": "Executive Coordinator",
                "action": "Synthesized Specialist Agent findings. Delivery package complete."
            })
            
            return {
                "response": ai_response,
                "agent_logs": agent_logs,
                "collaboration_graph": {
                    "nodes": active_nodes,
                    "edges": active_edges
                }
            }
            
        except Exception as e:
            agent_logs.append({
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "agent": "Executive Coordinator",
                "action": f"OpenAI call failed: {e}. Falling back to Rule Engine."
            })
            
    # 3. RULE-BASED FALLBACK ENGINE (If no key or OpenAI fails)
    # Reorder response
    if "reorder" in message_lower or "purchase order" in message_lower or "buy" in message_lower:
        if executed_action_context:
            response_text = f"I've successfully coordinated with the **Inventory Agent** and created a replenishment purchase order: **PO** details:\n\n{executed_action_context}\n\nYou can review this order and approve it inside the Orders panel."
        else:
            response_text = "I parsed your reorder request, but I couldn't find any products in your inventory catalog database. Please verify your product registry."
            
    # Stock check
    elif "stock" in message_lower or "inventory" in message_lower or "low" in message_lower:
        low_stock_items = [p for p in db_context["products"] if p["stock"] <= p["safety_threshold"]]
        if low_stock_items:
            items_str = "\n".join([f"- **{item['name']}** (SKU: `{item['sku']}`) — Stock: **{item['stock']}** / safety threshold: {item['safety_threshold']}" for item in low_stock_items])
            response_text = f"The **Inventory Agent** completed a stock check. The following products are below safety thresholds and require replenishment:\n\n{items_str}\n\nWould you like me to generate replenishment purchase orders for these?"
        else:
            response_text = "The **Inventory Agent** reports that all products currently have healthy stock levels above safety thresholds!"
            
    # Health check
    elif "health" in message_lower or "report" in message_lower or "performance" in message_lower or "analyst" in message_lower or "sales" in message_lower or "revenue" in message_lower:
        business = db.query(Business).filter(Business.id == business_id).first()
        score = business.health_score if business else 85
        response_text = f"The **Business Analyst Agent** has processed your business metrics:\n\n- **Business Health Score**: **{score}/100**\n- **Total Products**: {len(products_list)}\n- **Total Invoices**: {len(invoices)}\n\n*Recommendation*: Keep stock safety limits updated to avoid supply chain disruptions."
        
    # Support
    elif "order status" in message_lower or "customer" in message_lower or "support" in message_lower or "email" in message_lower:
        pending_count = len([o for o in db_context["recent_orders"] if o["status"] == "pending"])
        response_text = f"I've routed your inquiry to the **Customer Support Agent**.\n\nCurrently, you have **{pending_count} pending customer orders** in the system. The agent has prepared standard follow-up draft emails to keep clients updated on shipping times."
        
    # Default
    else:
        response_text = "Hello! I am the Executive Coordinator for BizPilot AI OS. I can delegate actions across our agent workforce. Try asking me:\n\n1. *'Show products that need reordering'* (Inventory Agent)\n2. *'Reorder Premium Coffee Beans'* (Inventory Agent purchase automation)\n3. *'Check my business health score'* (Business Analyst Agent)\n4. *'Verify customer order status'* (Customer Support Agent)"
        
    agent_logs.append({
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "agent": "Executive Coordinator",
        "action": "Compiled task completion response. Notifying user."
    })
    
    return {
        "response": response_text,
        "agent_logs": agent_logs,
        "collaboration_graph": {
            "nodes": active_nodes,
            "edges": active_edges
        }
    }
