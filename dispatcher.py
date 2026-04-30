from models import DeliveryAgent, Order, AgentStatus, OrderStatus, create_sample_agents
from city_graph import create_city_graph, find_shortest_path
from database import SessionLocal, OrderDB, AgentDB
import uuid
from datetime import datetime

# Initialize city graph
G, intersections = create_city_graph()

# In-memory storage (synced with DB)
agents = {a.id: a for a in create_sample_agents()}
orders = {}

def save_order_to_db(order: Order):
    """Save or update order in PostgreSQL"""
    db = SessionLocal()
    try:
        existing = db.query(OrderDB).filter(OrderDB.id == order.id).first()
        if existing:
            existing.status = order.status.value
            existing.assigned_agent_id = order.assigned_agent_id
            existing.delivered_at = order.delivered_at
        else:
            db_order = OrderDB(
                id=order.id,
                customer_name=order.customer_name,
                pickup_location=order.pickup_location,
                delivery_location=order.delivery_location,
                status=order.status.value,
                assigned_agent_id=order.assigned_agent_id,
                created_at=order.created_at
            )
            db.add(db_order)
        db.commit()
    finally:
        db.close()

def save_agent_to_db(agent: DeliveryAgent):
    """Save or update agent in PostgreSQL"""
    db = SessionLocal()
    try:
        existing = db.query(AgentDB).filter(AgentDB.id == agent.id).first()
        if existing:
            existing.current_location = agent.current_location
            existing.status = agent.status.value
            existing.total_deliveries = agent.total_deliveries
            existing.last_updated = datetime.now().isoformat()
        else:
            db_agent = AgentDB(
                id=agent.id,
                name=agent.name,
                current_location=agent.current_location,
                status=agent.status.value,
                total_deliveries=agent.total_deliveries
            )
            db.add(db_agent)
        db.commit()
    finally:
        db.close()

def get_orders_from_db():
    """Get all orders from PostgreSQL"""
    db = SessionLocal()
    try:
        return db.query(OrderDB).all()
    finally:
        db.close()

def find_nearest_agent(pickup_location: str):
    """Find the nearest idle agent to the pickup location"""
    nearest_agent = None
    min_distance = float('inf')

    for agent in agents.values():
        if agent.status == AgentStatus.IDLE:
            _, distance = find_shortest_path(G, agent.current_location, pickup_location)
            if distance < min_distance:
                min_distance = distance
                nearest_agent = agent

    return nearest_agent, min_distance

def assign_order(customer_name: str, pickup_location: str, delivery_location: str):
    """Create order and assign to nearest agent"""
    order = Order(
        id=str(uuid.uuid4()),
        customer_name=customer_name,
        pickup_location=pickup_location,
        delivery_location=delivery_location
    )
    orders[order.id] = order

    agent, distance = find_nearest_agent(pickup_location)

    if not agent:
        print(f"❌ No idle agents available!")
        save_order_to_db(order)
        return order, None

    path_to_pickup, _ = find_shortest_path(G, agent.current_location, pickup_location)
    path_to_delivery, _ = find_shortest_path(G, pickup_location, delivery_location)
    full_route = path_to_pickup + path_to_delivery[1:]

    agent.status = AgentStatus.MOVING_TO_PICKUP
    agent.current_order_id = order.id
    agent.route = full_route
    agent.route_index = 0

    order.status = OrderStatus.ASSIGNED
    order.assigned_agent_id = agent.id

    # Save to PostgreSQL
    save_order_to_db(order)
    save_agent_to_db(agent)

    print(f"✅ Order {order.id[:8]} assigned to {agent.name}")
    print(f"📍 Route: {' → '.join(full_route)}")

    return order, agent

def reassign_order(order_id: str):
    """Reassign an order to a different agent"""
    order = orders.get(order_id)
    if not order:
        return None, None

    current_agent = agents.get(order.assigned_agent_id)
    if current_agent:
        current_agent.status = AgentStatus.IDLE
        current_agent.current_order_id = None
        current_agent.route = []
        save_agent_to_db(current_agent)

    agent, _ = find_nearest_agent(order.pickup_location)
    if not agent:
        return order, None

    path_to_pickup, _ = find_shortest_path(G, agent.current_location, order.pickup_location)
    path_to_delivery, _ = find_shortest_path(G, order.pickup_location, order.delivery_location)
    full_route = path_to_pickup + path_to_delivery[1:]

    agent.status = AgentStatus.MOVING_TO_PICKUP
    agent.current_order_id = order.id
    agent.route = full_route
    agent.route_index = 0
    order.assigned_agent_id = agent.id

    save_order_to_db(order)
    save_agent_to_db(agent)

    print(f"🔄 Order {order.id[:8]} reassigned to {agent.name}")
    return order, agent

def get_all_agents():
    return [a.to_dict() for a in agents.values()]

def get_all_orders():
    return [o.to_dict() for o in orders.values()]