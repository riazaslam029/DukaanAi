from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.models.product import Product
from app.models.sale import Sale
from app.models.expense import Expense
from app.schemas.ai import AIStatusResponse, AIQueryResponse


class AIService:
    @staticmethod
    async def get_available_ollama_models() -> List[str]:
        """Query Ollama API to find all locally downloaded models."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    return [m.get("name") for m in models if m.get("name")]
        except Exception:
            pass
        return []

    @staticmethod
    async def resolve_active_model() -> Optional[str]:
        """
        Dynamically find the best matching model in Ollama.
        Prioritizes gemma3:1b, gemma models, or whatever is downloaded.
        """
        available = await AIService.get_available_ollama_models()
        if not available:
            return None

        # 1. Exact match with configured model (e.g. gemma3:1b)
        for m in available:
            if settings.OLLAMA_MODEL in m:
                return m

        # 2. Any Gemma family model
        for m in available:
            if "gemma" in m.lower():
                return m

        # 3. Fallback to first installed model
        return available[0]

    @staticmethod
    async def check_ollama_status() -> AIStatusResponse:
        """
        Check connectivity to the local Ollama instance running Gemma open-weight model.
        Phase 2 reserved interface.
        """
        ollama_url = settings.OLLAMA_BASE_URL
        target_model = settings.OLLAMA_MODEL
        available_models = await AIService.get_available_ollama_models()

        if available_models:
            active_model = await AIService.resolve_active_model()
            has_target = any(target_model in m for m in available_models)
            return AIStatusResponse(
                is_available=True,
                ollama_url=ollama_url,
                model_name=active_model or target_model,
                status="Connected & Ready",
                message=f"Connected to Ollama! Active model: '{active_model}'. Models available: {', '.join(available_models)}"
            )

        # Check if Ollama is running but no models pulled yet
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{ollama_url}/api/tags")
                if res.status_code == 200:
                    return AIStatusResponse(
                        is_available=True,
                        ollama_url=ollama_url,
                        model_name=target_model,
                        status="Ollama Online (Model Pulling / Not Pulled Yet)",
                        message=f"Ollama server is active at {ollama_url}. As soon as 'ollama pull {target_model}' finishes in your terminal, DukaanAI will connect automatically."
                    )
        except Exception:
            pass

        return AIStatusResponse(
            is_available=False,
            ollama_url=ollama_url,
            model_name=target_model,
            status="Offline / Ready for Phase 2",
            message=f"Local Ollama server not detected at {ollama_url}. DukaanAI will connect seamlessly once you run 'ollama run {target_model}' on your Windows PC."
        )

    @staticmethod
    async def query_assistant(db: Session, prompt: str, context_type: str = "general") -> AIQueryResponse:
        """
        Clean service interface for querying Gemma.
        Injects real retail context from SQLite.
        If Ollama is online, invokes Gemma open-weight model locally.
        If Ollama is not yet launched, returns deterministic shopkeeper insights with instructions to enable Gemma.
        """
        # Gather live retail context from SQLite
        low_stock_items = db.query(Product).filter(
            Product.is_active == True,
            Product.stock_quantity <= Product.min_stock_threshold
        ).all()

        total_products = db.query(Product).filter(Product.is_active == True).count()
        total_sales_val = db.query(func.coalesce(func.sum(Sale.net_amount), 0.0)).scalar() or 0.0
        total_expense_val = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).scalar() or 0.0

        low_stock_summary = ", ".join([f"{p.name} ({p.stock_quantity} {p.unit} left)" for p in low_stock_items[:5]])

        # Detect active Ollama model
        active_model = await AIService.resolve_active_model()

        if active_model:
            system_prompt = (
                f"You are DukaanAI Assistant for a Pakistani retail shopkeeper. "
                f"Current store state: Total products: {total_products}. "
                f"Low stock items: {low_stock_summary if low_stock_summary else 'None'}. "
                f"Total Sales: Rs. {total_sales_val:,.2f}. Total Expenses: Rs. {total_expense_val:,.2f}. "
                f"Provide concise, actionable business recommendations in Pakistani retail context (PKR)."
            )

            try:
                # Optimized inference options for fast CPU/GPU response
                async with httpx.AsyncClient(timeout=90.0) as client:
                    response = await client.post(
                        f"{settings.OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": active_model,
                            "prompt": f"{system_prompt}\n\nShopkeeper Question: {prompt}\nAnswer:",
                            "stream": False,
                            "options": {
                                "num_predict": 160,
                                "temperature": 0.6,
                                "top_p": 0.9
                            }
                        }
                    )
                    if response.status_code == 200:
                        text = response.json().get("response", "").strip()
                        if text:
                            return AIQueryResponse(
                                answer=text,
                                source=f"Local Gemma ({active_model})",
                                suggested_actions=["Review restock orders", "Adjust margins"],
                                model=active_model
                            )
            except Exception as e:
                print(f"[Ollama Inference Warning]: {e}")
                # Fallback to local heuristic engine if inference fails

        # Phase 1 Built-in Retail Assistant (Stub / Heuristic mode with full Phase 2 architecture)
        p_lower = prompt.lower()
        if "low stock" in p_lower or "inventory" in p_lower or "restock" in p_lower:
            if low_stock_items:
                items_str = "\n".join([f"• {p.name}: {p.stock_quantity} {p.unit} remaining (Min threshold: {p.min_stock_threshold})" for p in low_stock_items])
                answer = (
                    f"⚠️ **Low Stock Alert**: You have {len(low_stock_items)} items requiring urgent restock:\n\n"
                    f"{items_str}\n\n"
                    f"💡 **Recommendation**: Contact your wholesale distributors (Akbari Mandi / FMCG supply) to replenish these high-turnover Kiryana staples."
                )
                actions = ["Generate Purchase Order", "Filter Low Stock on Inventory Screen"]
            else:
                answer = "✅ **Inventory Health Good**: All active products are currently above their minimum safety thresholds."
                actions = ["Check Sales Trends", "Add New Products"]
        elif "profit" in p_lower or "margin" in p_lower or "sales" in p_lower:
            est_profit = total_sales_val - total_expense_val
            answer = (
                f"📊 **Financial Snapshot**:\n"
                f"• Total Recorded Revenue: **Rs. {total_sales_val:,.2f}**\n"
                f"• Operating Expenses: **Rs. {total_expense_val:,.2f}**\n"
                f"• Estimated Net Operating Margin: **Rs. {est_profit:,.2f}**\n\n"
                f"💡 **Tip**: Keep utility and carriage costs in check to maintain a healthy retail margin above 15-20%."
            )
            actions = ["View Detailed Reports", "Export CSV for Taxation"]
        else:
            target = settings.OLLAMA_MODEL
            answer = (
                f"DukaanAI Phase 1 is running smoothly with real-time SQLite analytics.\n\n"
                f"Store Status: {total_products} items tracked, {len(low_stock_items)} low-stock alerts, and Rs. {total_sales_val:,.2f} total sales.\n\n"
                f"🔹 **Phase 2 Gemma Ready**: Detecting Ollama with model `{target}`. As soon as your download completes in terminal, DukaanAI will automatically execute local reasoning through {target}."
            )
            actions = ["Inspect Low Stock", "Record New Sale", "Record Business Expense"]

        return AIQueryResponse(
            answer=answer,
            source="DukaanAI Rule Engine (Phase 2 Gemma Service Ready)",
            suggested_actions=actions,
            model=f"Gemma ({settings.OLLAMA_MODEL} reserved)"
        )
