import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.seed import seed_database

# Use an in-memory SQLite database for automated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db, force_reset=True)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["currency"] == "PKR"


def test_get_dashboard_summary(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "today_sales" in data
    assert "total_products" in data
    assert data["total_products"] > 0
    assert "weekly_trend" in data
    assert len(data["weekly_trend"]) > 0


def test_get_products_list_and_filter(client):
    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 20
    assert len(data["categories"]) > 0

    # Search filter
    search_res = client.get("/api/products?search=Dalda")
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1


def test_create_product(client):
    new_product = {
        "name": "Rooh Afza 1.5 Litre Jumbo",
        "sku": "TST-ROOH-15",
        "barcode": "999888777",
        "category": "Beverages & Tea",
        "description": "Jumbo size test pack",
        "purchase_price": 500.0,
        "selling_price": 580.0,
        "stock_quantity": 20,
        "min_stock_threshold": 5,
        "unit": "bottle",
        "is_active": True
    }
    response = client.post("/api/products", json=new_product)
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Rooh Afza 1.5 Litre Jumbo"
    assert created["selling_price"] == 580.0
    assert created["profit_margin"] > 0


def test_stock_adjustment(client):
    # Adjust stock of first product
    prods = client.get("/api/products").json()["items"]
    target_id = prods[0]["id"]
    initial_stock = prods[0]["stock_quantity"]

    res = client.post(f"/api/products/{target_id}/adjust-stock", json={
        "product_id": target_id,
        "adjustment": 5,
        "reason": "Test stock intake"
    })
    assert res.status_code == 200
    assert res.json()["stock_quantity"] == initial_stock + 5


def test_sales_checkout_and_stock_deduction(client):
    # Find a product with enough stock
    prods = client.get("/api/products").json()["items"]
    prod = next(p for p in prods if p["stock_quantity"] >= 5)
    prod_id = prod["id"]
    initial_stock = prod["stock_quantity"]

    sale_payload = {
        "items": [
            {"product_id": prod_id, "quantity": 2}
        ],
        "discount_amount": 10.0,
        "customer_name": "Test Customer",
        "customer_phone": "0300-1122334",
        "payment_method": "Cash",
        "notes": "Test checkout transaction"
    }

    res = client.post("/api/sales", json=sale_payload)
    assert res.status_code == 201
    sale_data = res.json()
    assert sale_data["invoice_number"].startswith("DUK-")
    assert sale_data["discount_amount"] == 10.0
    expected_total = prod["selling_price"] * 2
    assert sale_data["total_amount"] == expected_total
    assert sale_data["net_amount"] == expected_total - 10.0

    # Verify stock deduction
    updated_prod = client.get(f"/api/products/{prod_id}").json()
    assert updated_prod["stock_quantity"] == initial_stock - 2


def test_prevent_sale_exceeding_stock(client):
    prods = client.get("/api/products").json()["items"]
    prod = prods[0]
    prod_id = prod["id"]
    excessive_qty = prod["stock_quantity"] + 100

    sale_payload = {
        "items": [
            {"product_id": prod_id, "quantity": excessive_qty}
        ],
        "discount_amount": 0.0,
        "payment_method": "Cash"
    }

    res = client.post("/api/sales", json=sale_payload)
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()["detail"]


def test_expenses_crud(client):
    exp_payload = {
        "title": "Chai & Biscuits for guests",
        "category": "Chai & Refreshments",
        "amount": 350.0,
        "payment_method": "Cash",
        "notes": "Evening tea"
    }
    # Create
    create_res = client.post("/api/expenses", json=exp_payload)
    assert create_res.status_code == 201
    exp_id = create_res.json()["id"]

    # List
    list_res = client.get("/api/expenses")
    assert list_res.status_code == 200
    assert any(e["id"] == exp_id for e in list_res.json()["items"])

    # Delete
    del_res = client.delete(f"/api/expenses/{exp_id}")
    assert del_res.status_code == 200


def test_reports_summary_and_csv(client):
    rep_res = client.get("/api/reports/summary?period=last_7_days")
    assert rep_res.status_code == 200
    data = rep_res.json()
    assert "total_sales" in data
    assert "gross_profit" in data
    assert "net_profit" in data
    assert len(data["daily_chart"]) > 0

    # CSV Exports
    csv_sales = client.get("/api/reports/export/sales")
    assert csv_sales.status_code == 200
    assert "Invoice #" in csv_sales.text

    csv_exp = client.get("/api/reports/export/expenses")
    assert csv_exp.status_code == 200
    assert "Category" in csv_exp.text

    csv_inv = client.get("/api/reports/export/inventory")
    assert csv_inv.status_code == 200
    assert "Product Name" in csv_inv.text


def test_ai_status_and_query_interface(client):
    # Test status check (Phase 2 Gemma interface)
    status_res = client.get("/api/ai/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "model_name" in status_data
    assert "gemma" in status_data["model_name"]

    # Test query
    query_res = client.post("/api/ai/query", json={"prompt": "Which products are low on stock?", "context_type": "low_stock"})
    assert query_res.status_code == 200
    ans_data = query_res.json()
    assert "answer" in ans_data
    assert len(ans_data["answer"]) > 0
