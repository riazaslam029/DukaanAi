from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import random
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.expense import Expense
from app.models.settings import StoreSettings


SEED_PRODUCTS = [
    {
        "name": "Dalda Cooking Oil (Pouch 1 Litre)",
        "sku": "OIL-DAL-1L",
        "barcode": "896400010011",
        "category": "Groceries & Staples",
        "description": "Pure edible cooking oil with vitamins A & D",
        "purchase_price": 480.0,
        "selling_price": 520.0,
        "stock_quantity": 28,
        "min_stock_threshold": 8,
        "unit": "litre"
    },
    {
        "name": "Mezan Canola Oil (5 Litre Tin)",
        "sku": "OIL-MEZ-5L",
        "barcode": "896400010028",
        "category": "Groceries & Staples",
        "description": "Heart healthy triple refined canola oil tin",
        "purchase_price": 2450.0,
        "selling_price": 2650.0,
        "stock_quantity": 9,
        "min_stock_threshold": 4,
        "unit": "tin"
    },
    {
        "name": "Guard Super Kernel Basmati Rice (1 Kg)",
        "sku": "RICE-GRD-1KG",
        "barcode": "896400020015",
        "category": "Groceries & Staples",
        "description": "Aromatic aged long grain Pakistani basmati rice",
        "purchase_price": 320.0,
        "selling_price": 365.0,
        "stock_quantity": 42,
        "min_stock_threshold": 10,
        "unit": "kg"
    },
    {
        "name": "Chakki Whole Wheat Atta (10 Kg Bag)",
        "sku": "FLOUR-CHK-10KG",
        "barcode": "896400020053",
        "category": "Groceries & Staples",
        "description": "100% whole grain stone ground Pakistani chakki atta",
        "purchase_price": 1350.0,
        "selling_price": 1450.0,
        "stock_quantity": 16,
        "min_stock_threshold": 5,
        "unit": "bag"
    },
    {
        "name": "Daal Chana Special (1 Kg)",
        "sku": "PULSE-CHN-1KG",
        "barcode": "896400020077",
        "category": "Groceries & Staples",
        "description": "Cleaned premium split Bengal gram",
        "purchase_price": 260.0,
        "selling_price": 295.0,
        "stock_quantity": 30,
        "min_stock_threshold": 8,
        "unit": "kg"
    },
    {
        "name": "Shan Special Bombay Biryani Masala (50g)",
        "sku": "SPICE-SHN-BBRY",
        "barcode": "896400030012",
        "category": "Spices & Masalas",
        "description": "Authentic spice mix for Karachi & Bombay style biryani",
        "purchase_price": 85.0,
        "selling_price": 100.0,
        "stock_quantity": 45,
        "min_stock_threshold": 10,
        "unit": "pack"
    },
    {
        "name": "Shan Korma Recipe Masala (50g)",
        "sku": "SPICE-SHN-KRM",
        "barcode": "896400030029",
        "category": "Spices & Masalas",
        "description": "Traditional meat korma curry seasoning",
        "purchase_price": 85.0,
        "selling_price": 100.0,
        "stock_quantity": 32,
        "min_stock_threshold": 8,
        "unit": "pack"
    },
    {
        "name": "National Red Chilli Powder (200g)",
        "sku": "SPICE-NAT-RCHL",
        "barcode": "896400030043",
        "category": "Spices & Masalas",
        "description": "Pure ground Lal Mirch powder",
        "purchase_price": 240.0,
        "selling_price": 275.0,
        "stock_quantity": 25,
        "min_stock_threshold": 6,
        "unit": "pack"
    },
    {
        "name": "National Chilli Garlic Sauce (500g Bottle)",
        "sku": "SAUCE-NAT-CGS",
        "barcode": "896400040019",
        "category": "Groceries & Staples",
        "description": "Tangy Pakistani chili garlic sauce glass bottle",
        "purchase_price": 280.0,
        "selling_price": 325.0,
        "stock_quantity": 14,
        "min_stock_threshold": 5,
        "unit": "bottle"
    },
    {
        "name": "Tapal Danedar Black Tea (450g Pack)",
        "sku": "TEA-TAP-450G",
        "barcode": "896400050016",
        "category": "Beverages & Tea",
        "description": "Pakistan's favorite robust granular blend tea",
        "purchase_price": 630.0,
        "selling_price": 700.0,
        "stock_quantity": 24,
        "min_stock_threshold": 6,
        "unit": "pack"
    },
    {
        "name": "Vital Green Tea Honey & Lemon (30 Bags)",
        "sku": "TEA-VIT-GRN",
        "barcode": "896400050030",
        "category": "Beverages & Tea",
        "description": "Natural soothing antioxidant green tea box",
        "purchase_price": 210.0,
        "selling_price": 250.0,
        "stock_quantity": 18,
        "min_stock_threshold": 4,
        "unit": "box"
    },
    {
        "name": "Rooh Afza Sharbat (800ml Bottle)",
        "sku": "BEV-HAM-ROOH",
        "barcode": "896400050078",
        "category": "Beverages & Tea",
        "description": "Original herbal refreshing summer red drink",
        "purchase_price": 380.0,
        "selling_price": 430.0,
        "stock_quantity": 3,
        "min_stock_threshold": 8,
        "unit": "bottle"
    },
    {
        "name": "Olper's Full Cream Milk (1 Litre Tetra Pak)",
        "sku": "DAIRY-OLP-1L",
        "barcode": "896400060013",
        "category": "Dairy & Breakfast",
        "description": "UHT homogenized pure cow milk",
        "purchase_price": 270.0,
        "selling_price": 295.0,
        "stock_quantity": 35,
        "min_stock_threshold": 12,
        "unit": "pack"
    },
    {
        "name": "Tarang Tea Whitener (1 Litre Tetra Pak)",
        "sku": "DAIRY-TRG-1L",
        "barcode": "896400060044",
        "category": "Dairy & Breakfast",
        "description": "Special rich tea whitener liquid",
        "purchase_price": 235.0,
        "selling_price": 260.0,
        "stock_quantity": 22,
        "min_stock_threshold": 8,
        "unit": "pack"
    },
    {
        "name": "Mitchell's Mixed Fruit Jam (450g Jar)",
        "sku": "BRK-MIT-JAM",
        "barcode": "896400060082",
        "category": "Dairy & Breakfast",
        "description": "Sweet breakfast fruit spread preserve",
        "purchase_price": 310.0,
        "selling_price": 360.0,
        "stock_quantity": 11,
        "min_stock_threshold": 4,
        "unit": "jar"
    },
    {
        "name": "Fauji Corn Flakes (250g Box)",
        "sku": "BRK-FAU-CRN",
        "barcode": "896400060099",
        "category": "Dairy & Breakfast",
        "description": "Crispy golden breakfast corn cereal",
        "purchase_price": 290.0,
        "selling_price": 340.0,
        "stock_quantity": 4,
        "min_stock_threshold": 5,
        "unit": "box"
    },
    {
        "name": "Kolson Penne Macaroni (400g)",
        "sku": "PST-KOL-PEN",
        "barcode": "896400070010",
        "category": "Groceries & Staples",
        "description": "100% durum wheat semolina pasta",
        "purchase_price": 140.0,
        "selling_price": 165.0,
        "stock_quantity": 26,
        "min_stock_threshold": 6,
        "unit": "pack"
    },
    {
        "name": "LU Prince Chocolate Biscuits (Half Roll)",
        "sku": "SNK-LU-PRINCE",
        "barcode": "896400080017",
        "category": "Snacks & Confectionery",
        "description": "Crisp biscuits with rich chocolate cream filling",
        "purchase_price": 36.0,
        "selling_price": 45.0,
        "stock_quantity": 55,
        "min_stock_threshold": 15,
        "unit": "pack"
    },
    {
        "name": "EBM Sooper Egg & Milk Biscuits (Tikki Pack)",
        "sku": "SNK-EBM-SOOP",
        "barcode": "896400080031",
        "category": "Snacks & Confectionery",
        "description": "All-time favorite sweet tea biscuit",
        "purchase_price": 28.0,
        "selling_price": 35.0,
        "stock_quantity": 80,
        "min_stock_threshold": 20,
        "unit": "pack"
    },
    {
        "name": "Lays Masala Potato Chips (Rs. 50 Pack)",
        "sku": "SNK-LAY-MSL50",
        "barcode": "896400080055",
        "category": "Snacks & Confectionery",
        "description": "Spicy Pakistani masala flavored potato crisps",
        "purchase_price": 42.0,
        "selling_price": 50.0,
        "stock_quantity": 3,
        "min_stock_threshold": 12,
        "unit": "pack"
    },
    {
        "name": "Lifebuoy Total 10 Germ Protection Soap (115g)",
        "sku": "PC-LFB-115G",
        "barcode": "896400090014",
        "category": "Personal Care",
        "description": "Antibacterial daily hygiene bath bar",
        "purchase_price": 110.0,
        "selling_price": 130.0,
        "stock_quantity": 2,
        "min_stock_threshold": 10,
        "unit": "piece"
    },
    {
        "name": "Dettol Original Antiseptic Liquid (100ml)",
        "sku": "PC-DET-100ML",
        "barcode": "896400090038",
        "category": "Personal Care",
        "description": "Hospital grade disinfectant & first aid antiseptic",
        "purchase_price": 240.0,
        "selling_price": 280.0,
        "stock_quantity": 14,
        "min_stock_threshold": 5,
        "unit": "bottle"
    },
    {
        "name": "Surf Excel Quick Wash Detergent Powder (500g)",
        "sku": "CL-SRF-500G",
        "barcode": "896400100018",
        "category": "Household & Cleaning",
        "description": "Stain removal laundry powder",
        "purchase_price": 320.0,
        "selling_price": 375.0,
        "stock_quantity": 19,
        "min_stock_threshold": 6,
        "unit": "pack"
    },
    {
        "name": "Bonus Tristar Washing Powder (1 Kg)",
        "sku": "CL-BNS-1KG",
        "barcode": "896400100032",
        "category": "Household & Cleaning",
        "description": "High foam value laundry detergent",
        "purchase_price": 290.0,
        "selling_price": 330.0,
        "stock_quantity": 15,
        "min_stock_threshold": 5,
        "unit": "pack"
    },
    {
        "name": "Rose Petal Maxob Kitchen Towel (Twin Pack)",
        "sku": "CL-RPT-TWN",
        "barcode": "896400100063",
        "category": "Household & Cleaning",
        "description": "Extra absorbent embossed paper rolls",
        "purchase_price": 220.0,
        "selling_price": 260.0,
        "stock_quantity": 8,
        "min_stock_threshold": 4,
        "unit": "pack"
    }
]


def seed_database(db: Session, force_reset: bool = False):
    """Seed SQLite database with realistic Pakistani retail data."""
    if force_reset:
        db.query(SaleItem).delete()
        db.query(Sale).delete()
        db.query(Expense).delete()
        db.query(Product).delete()
        db.query(StoreSettings).delete()
        db.commit()

    # 1. Seed Store Settings
    store_setting = db.query(StoreSettings).first()
    if not store_setting:
        store_setting = StoreSettings(
            store_name="Bismillah Kiryana & General Store",
            owner_name="Haji Muhammad Aslam",
            phone="0300-1234567",
            address="Shop #4, Main Market, Gulberg III",
            city="Lahore",
            currency="PKR",
            currency_symbol="Rs.",
            default_low_stock_threshold=5,
            receipt_footer="JazakAllah Khair for your purchase! Shukriya for choosing DukaanAI."
        )
        db.add(store_setting)
        db.commit()

    # 2. Seed Products
    existing_count = db.query(Product).count()
    if existing_count == 0:
        for p_data in SEED_PRODUCTS:
            prod = Product(
                name=p_data["name"],
                sku=p_data["sku"],
                barcode=p_data["barcode"],
                category=p_data["category"],
                description=p_data["description"],
                purchase_price=p_data["purchase_price"],
                selling_price=p_data["selling_price"],
                stock_quantity=p_data["stock_quantity"],
                min_stock_threshold=p_data["min_stock_threshold"],
                unit=p_data["unit"],
                is_active=True
            )
            db.add(prod)
        db.commit()

    products = db.query(Product).filter(Product.is_active == True).all()

    # 3. Seed Operating Expenses (Past 10 Days)
    if db.query(Expense).count() == 0:
        now = datetime.now(timezone.utc)
        expenses_to_add = [
            ("Shop Monthly Rent - Main Market", "Shop Rent", 35000.0, "Bank Transfer", 8, "Rent paid to landlord Malik Sahib"),
            ("LESCO Commercial Electricity Bill", "Electricity / Utilities", 14850.0, "JazzCash", 6, "Peak summer utility bill"),
            ("Helper Weekly Wage - Bilal", "Staff Wages", 6000.0, "Cash", 5, "Store helper weekly compensation"),
            ("Rickshaw Carriage - Akbari Mandi Supplies", "Transport & Carriage", 1850.0, "Cash", 4, "Goods transportation charges"),
            ("Daily Chai & Biscuit for Staff & Customers", "Chai & Refreshments", 480.0, "Cash", 3, "Afternoon refreshments"),
            ("Polythene & Paper Shopping Bags (10kg Bundle)", "Packaging & Bags", 2400.0, "Cash", 2, "Wholesale bag packaging supplies"),
            ("Shutter Lock Repair & New LED Tube Light", "Repairs & Maintenance", 1350.0, "Cash", 1, "Shop lighting maintenance"),
            ("Fresh Milk & Morning Chai", "Chai & Refreshments", 450.0, "Cash", 0, "Morning shopkeeper tea")
        ]

        for title, cat, amt, pm, days_ago, notes in expenses_to_add:
            exp_date = now - timedelta(days=days_ago, hours=random.randint(1, 6))
            exp = Expense(
                title=title,
                category=cat,
                amount=amt,
                payment_method=pm,
                date=exp_date,
                notes=notes
            )
            db.add(exp)
        db.commit()

    # 4. Seed Historical Sales Transactions (Past 7 Days)
    if db.query(Sale).count() == 0 and products:
        now = datetime.now(timezone.utc)
        demo_customers = [
            ("Ahmed Khan", "0301-4455667"),
            ("Bhai Usman", "0321-9876543"),
            ("Tariq Sahab", "0333-1122334"),
            ("Fatima Bibi", None),
            ("Hassan Raza", "0345-5566778"),
            ("Zahid Kiryana Customer", None),
            ("Chaudhry Akram", "0300-8877665"),
            ("Dr. Imran", "0312-3344556"),
            ("Walk-in Customer", None)
        ]
        payment_methods = ["Cash", "Cash", "Cash", "JazzCash", "EasyPaisa", "Udhaar/Credit", "Bank Transfer"]

        invoice_seq = 1
        # Create sales across last 7 days
        for days_ago in range(6, -1, -1):
            day_dt = now - timedelta(days=days_ago)
            # 3 to 6 sales per day
            num_sales = random.randint(3, 5) if days_ago > 0 else 4
            for s_idx in range(num_sales):
                c_name, c_phone = random.choice(demo_customers)
                p_method = random.choice(payment_methods)
                sale_time = day_dt.replace(
                    hour=random.randint(9, 21),
                    minute=random.randint(5, 55),
                    second=random.randint(0, 59)
                )

                inv_num = f"DUK-{sale_time.strftime('%Y%m%d')}-{invoice_seq:04d}"
                invoice_seq += 1

                # Pick 2 to 4 random products
                chosen_prods = random.sample(products, k=min(len(products), random.randint(2, 4)))
                sale_items: list[SaleItem] = []
                total_sale = 0.0
                total_cost = 0.0

                for prod in chosen_prods:
                    qty = random.randint(1, 3)
                    unit_p = prod.selling_price
                    unit_c = prod.purchase_price
                    sub = round(qty * unit_p, 2)
                    c_sub = round(qty * unit_c, 2)
                    pft = round(sub - c_sub, 2)

                    sale_items.append(SaleItem(
                        product_id=prod.id,
                        product_name=prod.name,
                        quantity=qty,
                        unit_purchase_price=unit_c,
                        unit_selling_price=unit_p,
                        subtotal=sub,
                        cost_subtotal=c_sub,
                        profit=pft
                    ))
                    total_sale += sub
                    total_cost += c_sub

                discount = 20.0 if (total_sale > 1000 and random.random() > 0.6) else 0.0
                net_sale = round(total_sale - discount, 2)
                gross_pft = round(net_sale - total_cost, 2)

                sale = Sale(
                    invoice_number=inv_num,
                    total_amount=round(total_sale, 2),
                    discount_amount=discount,
                    net_amount=net_sale,
                    total_cost=round(total_cost, 2),
                    gross_profit=gross_pft,
                    customer_name=c_name,
                    customer_phone=c_phone,
                    payment_method=p_method,
                    notes="Counter Sale" if not discount else f"Special discount Rs. {discount:.0f}",
                    created_at=sale_time,
                    items=sale_items
                )
                db.add(sale)

        db.commit()
