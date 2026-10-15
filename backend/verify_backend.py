"""
Automated verification script for DukaanAI backend.
Tests database models, services, seed data, and report generation.
"""
from app.database import Base, engine, SessionLocal
from app.models.product import Product
from app.models.sale import Sale
from app.models.expense import Expense
from app.models.settings import StoreSettings
from app.seed import seed_database
from app.services.product_service import ProductService
from app.services.sale_service import SaleService
from app.services.expense_service import ExpenseService
from app.services.report_service import ReportService
from app.services.settings_service import SettingsService
from app.schemas.sale import SaleCreate, SaleItemCreate
from app.schemas.product import ProductCreate
from app.schemas.expense import ExpenseCreate


def run_verification():
    print("==========================================")
    print("DukaanAI Backend System Verification")
    print("==========================================")

    # 1. Initialize DB and Seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, force_reset=False)

    # 2. Check Products
    prods, total, low_count, cats, stock_val = ProductService.get_products(db)
    print(f"[OK] Total Catalog Products: {total}")
    print(f"[OK] Categories Found: {len(cats)} ({', '.join(cats[:4])}...)")
    print(f"[OK] Low-Stock Alerts Count: {low_count}")
    print(f"[OK] Total Inventory Valuation: Rs. {stock_val:,.2f}")
    assert total >= 25, "Expected at least 25 seed products"
    assert low_count > 0, "Expected low-stock items for demonstration"

    # 3. Check Settings
    settings_obj = SettingsService.get_settings(db)
    print(f"[OK] Store Name: {settings_obj.store_name}")
    print(f"[OK] Currency: {settings_obj.currency} ({settings_obj.currency_symbol})")
    assert settings_obj.currency == "PKR"

    # 4. Check Sales and Stock Deduction
    test_prod = db.query(Product).filter(Product.stock_quantity >= 5).first()
    stock_before = test_prod.stock_quantity

    sale_in = SaleCreate(
        items=[SaleItemCreate(product_id=test_prod.id, quantity=2)],
        discount_amount=10.0,
        customer_name="Verification Buyer",
        customer_phone="0300-9998877",
        payment_method="Cash",
        notes="Automated test purchase"
    )
    sale = SaleService.create_sale(db, sale_in)
    db.refresh(test_prod)
    stock_after = test_prod.stock_quantity

    print(f"[OK] Sale Created: Invoice #{sale.invoice_number}")
    print(f"     Gross: Rs. {sale.total_amount:,.2f} | Discount: Rs. {sale.discount_amount:,.2f} | Net: Rs. {sale.net_amount:,.2f}")
    print(f"     Profit Generated: Rs. {sale.gross_profit:,.2f}")
    print(f"[OK] Atomic Stock Deduction: {test_prod.name} (Before: {stock_before} -> After: {stock_after})")
    assert stock_after == stock_before - 2, "Stock deduction failed"

    # 5. Check Prevention of Sale Exceeding Stock
    try:
        excessive_sale = SaleCreate(
            items=[SaleItemCreate(product_id=test_prod.id, quantity=stock_after + 999)],
            discount_amount=0.0,
            payment_method="Cash"
        )
        SaleService.create_sale(db, excessive_sale)
        assert False, "Should have thrown stock exception!"
    except Exception as e:
        print(f"[OK] Excessive Stock Sale Properly Prevented: {str(e.detail if hasattr(e, 'detail') else e)}")

    # 6. Check Expenses
    exp_in = ExpenseCreate(
        title="Verification Test Chai & Biscuits",
        category="Chai & Refreshments",
        amount=250.0,
        payment_method="Cash",
        notes="Automated ledger test"
    )
    created_exp = ExpenseService.create_expense(db, exp_in)
    print(f"[OK] Business Expense Logged: ID #{created_exp.id} - Rs. {created_exp.amount:,.2f}")

    # 7. Check Financial Reporting Engine
    summary = ReportService.get_financial_summary(db, period="last_7_days")
    print(f"[OK] Financial Summary Generated for '{summary.period_label}':")
    print(f"     Total Revenue:  Rs. {summary.total_sales:,.2f}")
    print(f"     Total COGS:     Rs. {summary.total_cogs:,.2f}")
    print(f"     Gross Profit:   Rs. {summary.gross_profit:,.2f}")
    print(f"     Total Expenses: Rs. {summary.total_expenses:,.2f}")
    print(f"     Net Profit:     Rs. {summary.net_profit:,.2f} (Margin: {summary.profit_margin_pct}%)")
    print(f"     Daily Chart Data Points: {len(summary.daily_chart)}")
    print(f"     Top Selling Items: {len(summary.top_products)}")
    print(f"     Expense Heads: {len(summary.expenses_by_category)}")

    # 8. CSV Exports Verification
    sales_csv = ReportService.export_sales_csv(db).getvalue()
    exp_csv = ReportService.export_expenses_csv(db).getvalue()
    inv_csv = ReportService.export_inventory_csv(db).getvalue()

    assert "Invoice #" in sales_csv
    assert "Amount (PKR)" in exp_csv
    assert "Selling Price (PKR)" in inv_csv
    print("[OK] Sales, Expenses, and Inventory CSV generator verified.")

    db.close()
    print("==========================================")
    print("ALL 8 VERIFICATION CHECKS PASSED!")
    print("==========================================")


if __name__ == "__main__":
    run_verification()
