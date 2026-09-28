import logging
import json
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("memorasupport.hindsight")

class HindsightService:
    """
    Hindsight Persistent Customer Memory Service.
    Provides isolated long-term memory per customer using Hindsight bank_id: 'customer_<customer_id>'.
    
    Capabilities:
    - Retain: Stores customer facts, issues, preferences, solutions, orders with importance ratings.
    - Recall: Retrieves relevant customer memories via intent/keyword/category scoring with transparency reasons.
    - Recall Solutions: Directly fetches verified past resolutions when similar problems re-occur.
    - Reflect / Dashboard: Surfaces structured memory categories for customer & admin dashboards.
    """

    def __init__(self):
        self.base_url = settings.HINDSIGHT_API_URL.rstrip('/')
        self.api_key = settings.HINDSIGHT_API_KEY
        self.enabled = settings.HINDSIGHT_ENABLED
        self._fallback_memory: Dict[str, List[Dict[str, Any]]] = {}
        self._last_server_check: float = 0.0
        self._server_is_reachable: bool = False

    def _get_bank_id(self, customer_id: str) -> str:
        """Isolated memory bank per customer identity to prevent cross-customer data leakage."""
        return f"customer_{customer_id}"

    def check_connection(self) -> bool:
        """Fast non-blocking check if Hindsight API server is alive."""
        if not self.enabled:
            return False
        
        now = time.time()
        # Cache check for 15 seconds to avoid network latency on every request
        if now - self._last_server_check < 15.0:
            return self._server_is_reachable

        self._last_server_check = now
        try:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            # Short connect timeout of 0.3s so tests and offline dev remain lightning fast
            timeout = httpx.Timeout(connect=0.3, read=1.0, write=1.0, pool=1.0)
            with httpx.Client(timeout=timeout) as client:
                res = client.get(f"{self.base_url}/health", headers=headers)
                self._server_is_reachable = (res.status_code == 200)
                return self._server_is_reachable
        except Exception:
            self._server_is_reachable = False
            return False

    def retain_memory(
        self, 
        customer_id: str, 
        content: str, 
        category: str = "important_fact",
        importance: str = "medium",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Store a structured long-term memory item into Hindsight for the given customer.
        Prevents exact duplicate memories and tracks metadata + timestamps.
        """
        bank_id = self._get_bank_id(customer_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        item = {
            "content": content.strip(),
            "category": category,
            "importance": importance,
            "created_at": now_iso,
            "metadata": metadata or {}
        }

        # 1. Try real Hindsight API if server is reachable
        if self.check_connection():
            try:
                headers = {"Content-Type": "application/json"}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                payload = {
                    "bank_id": bank_id,
                    "items": [item]
                }
                
                timeout = httpx.Timeout(connect=0.5, read=2.0, write=2.0, pool=2.0)
                with httpx.Client(timeout=timeout) as client:
                    res = client.post(f"{self.base_url}/v1/retain", json=payload, headers=headers)
                    if res.status_code in (200, 201):
                        logger.info(f"[HINDSIGHT REAL] Retained memory for bank {bank_id}: {content[:60]}...")
                        # Keep local mirror up to date
                        self._store_fallback(bank_id, item)
                        return {"success": True, "is_fallback": False, "memory": item}
            except Exception as e:
                logger.warning(f"[HINDSIGHT FALLBACK] Failed to retain via API: {e}")
                self._server_is_reachable = False

        # 2. Local isolated adapter fallback
        self._store_fallback(bank_id, item)
        logger.info(f"[HINDSIGHT FALLBACK] Saved memory in isolated bank {bank_id} [{category}]: {content[:60]}...")
        return {"success": True, "is_fallback": True, "memory": item}

    def _store_fallback(self, bank_id: str, item: Dict[str, Any]):
        """Helper to append unique memory item in local isolated bank."""
        if bank_id not in self._fallback_memory:
            self._fallback_memory[bank_id] = []
        
        # Deduplicate by case-insensitive content match
        clean_content = item["content"].strip().lower()
        for existing in self._fallback_memory[bank_id]:
            if existing["content"].strip().lower() == clean_content:
                # Update category/importance if higher
                if item.get("importance") == "high":
                    existing["importance"] = "high"
                existing["category"] = item.get("category", existing.get("category"))
                return
        
        self._fallback_memory[bank_id].append(item)

    def recall_memories(
        self, 
        customer_id: str, 
        query: str, 
        limit: int = 5,
        target_categories: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Intelligently recall relevant customer memories from Hindsight.
        Scores relevance based on query keywords, customer intent, category weighting,
        and generates an explainable 'reason' for why each memory was retrieved.
        """
        bank_id = self._get_bank_id(customer_id)

        # 1. Try real Hindsight API if reachable
        if self.check_connection():
            try:
                headers = {"Content-Type": "application/json"}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                payload = {
                    "bank_id": bank_id,
                    "query": query,
                    "limit": limit
                }
                
                timeout = httpx.Timeout(connect=0.5, read=2.0, write=2.0, pool=2.0)
                with httpx.Client(timeout=timeout) as client:
                    res = client.post(f"{self.base_url}/v1/recall", json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        raw_results = data.get("results", [])
                        logger.info(f"[HINDSIGHT REAL] Recalled {len(raw_results)} memories for bank {bank_id}")
                        return self._enrich_memories_with_reasons(raw_results, query)[:limit]
            except Exception as e:
                logger.warning(f"[HINDSIGHT FALLBACK] Recall API error: {e}")
                self._server_is_reachable = False

        # 2. Local multi-strategy retrieval
        customer_memories = self._fallback_memory.get(bank_id, [])
        if not customer_memories:
            return []

        query_lower = query.lower()
        words = [w for w in query_lower.split() if len(w) > 2]
        
        # Intent indicators
        is_refund_query = any(w in query_lower for w in ["refund", "money", "charged", "return", "payment"])
        is_delay_query = any(w in query_lower for w in ["delay", "delayed", "late", "where is", "track", "status", "ship"])
        is_issue_repeat = any(w in query_lower for w in ["again", "still", "not working", "failed", "same issue", "broken"])

        scored = []
        for mem in customer_memories:
            content = mem.get("content", "")
            content_lower = content.lower()
            category = mem.get("category", "important_fact")
            importance = mem.get("importance", "medium")

            # Filter by target categories if specified
            if target_categories and category not in target_categories:
                continue

            score = 0.0

            # Match keywords
            word_matches = sum(1 for w in words if w in content_lower)
            score += word_matches * 3.0

            # Intent & category relevance
            if is_refund_query:
                if category in ("unresolved", "issue", "order_information") or "order #" in content_lower or "delayed" in content_lower or "refund" in content_lower:
                    score += 5.0
                if "prefer email" in content_lower or category == "communication_preference":
                    score += 2.0
            
            if is_delay_query:
                if "order #" in content_lower or "delayed" in content_lower or category in ("issue", "order_information"):
                    score += 5.0

            if is_issue_repeat:
                if category == "solution" or "resolved" in content_lower or "fixed" in content_lower:
                    score += 6.0 # Highly prioritize past solutions!
                if category == "issue":
                    score += 4.0

            # Always give subtle weight to communication preferences
            if category in ("preference", "communication_preference") or "prefer" in content_lower:
                score += 2.5

            # Importance weighting
            if importance == "high":
                score += 2.0

            # Generate transparency reason
            reason = self._generate_memory_reason(content, category, query_lower)

            enriched = dict(mem)
            enriched["relevance_score"] = score
            enriched["reason"] = reason
            scored.append((score, enriched))

        # Sort by relevance score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        
        # Take top items with score > 0 or all if few
        results = [mem for score, mem in scored if score > 0.5]
        if not results and customer_memories:
            # Fallback to most recent memories with generic reason
            results = [
                dict(m, reason="Used to provide personalized customer context.")
                for m in reversed(customer_memories[-limit:])
            ]

        return results[:limit]

    def recall_solutions(self, customer_id: str, issue_context: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Recall past verified successful solutions that resolved a similar issue.
        """
        return self.recall_memories(
            customer_id=customer_id, 
            query=issue_context, 
            limit=limit, 
            target_categories=["solution"]
        )

    def _generate_memory_reason(self, content: str, category: str, query_lower: str) -> str:
        """Create a clear, human-understandable explanation for why a memory was chosen."""
        content_lower = content.lower()

        if category == "solution" or "resolved" in content_lower or "solution" in content_lower:
            return "Used because your message describes a problem that was previously resolved by this solution."
        if "prefer" in content_lower or category in ("preference", "communication_preference"):
            return "Used to communicate via your preferred channel without having to re-ask."
        if "order #" in content_lower or category == "order_information":
            if any(w in query_lower for w in ["refund", "status", "order", "where", "arrive", "delayed"]):
                return "Used because your inquiry references this existing order, avoiding asking you for the order number again."
            return "Used to link your inquiry to your known order details."
        if category in ("issue", "unresolved") or "delay" in content_lower or "failed" in content_lower:
            return "Used because your current message relates to this ongoing or previous issue."
        return "Used to provide consistent, personalized customer context."

    def _enrich_memories_with_reasons(self, memories: List[Dict[str, Any]], query: str) -> List[Dict[str, Any]]:
        """Add reasons to memories returned by external API."""
        enriched = []
        for mem in memories:
            m = dict(mem)
            if "reason" not in m:
                m["reason"] = self._generate_memory_reason(
                    m.get("content", ""), 
                    m.get("category", "important_fact"), 
                    query.lower()
                )
            enriched.append(m)
        return enriched

    def get_customer_memories(self, customer_id: str) -> Dict[str, Any]:
        """
        Retrieve structured long-term memory categories for the customer dashboard and admin views.
        Organized into:
        - Preferences
        - Previous Issues
        - Successful Solutions
        - Unresolved Issues
        - Orders
        - Important Info
        """
        bank_id = self._get_bank_id(customer_id)
        raw_memories = []
        is_fallback = True

        if self.check_connection():
            try:
                headers = {}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                timeout = httpx.Timeout(connect=0.5, read=2.0, write=2.0, pool=2.0)
                with httpx.Client(timeout=timeout) as client:
                    res = client.get(f"{self.base_url}/v1/banks/{bank_id}/memories", headers=headers)
                    if res.status_code == 200:
                        raw_memories = res.json().get("memories", [])
                        is_fallback = False
            except Exception as e:
                logger.warning(f"Failed to fetch memories from Hindsight REST API: {e}")
                self._server_is_reachable = False

        if is_fallback or not raw_memories:
            raw_memories = self._fallback_memory.get(bank_id, [])

        preferences = []
        previous_issues = []
        successful_solutions = []
        unresolved_issues = []
        orders = []
        important_info = []

        for item in raw_memories:
            cat = item.get("category", "important_fact")
            content = item.get("content", "")
            content_lower = content.lower()

            if cat in ("preference", "communication_preference") or "prefer" in content_lower:
                preferences.append(content)
            elif cat == "solution" or "resolved" in content_lower or "solution" in content_lower:
                successful_solutions.append(content)
            elif cat == "unresolved" or "pending" in content_lower:
                unresolved_issues.append(content)
            elif cat in ("order_information",) or ("order #" in content_lower and "delay" not in content_lower):
                orders.append(content)
            elif cat == "issue" or "delayed" in content_lower or "failed" in content_lower or "error" in content_lower:
                previous_issues.append(content)
            else:
                important_info.append(content)

        return {
            "customer_id": customer_id,
            "bank_id": bank_id,
            "preferences": list(dict.fromkeys(preferences)),
            "previous_issues": list(dict.fromkeys(previous_issues)),
            "successful_solutions": list(dict.fromkeys(successful_solutions)),
            "unresolved_issues": list(dict.fromkeys(unresolved_issues)),
            "orders": list(dict.fromkeys(orders)),
            "important_info": list(dict.fromkeys(important_info)),
            "raw_memories": raw_memories,
            "is_fallback": is_fallback
        }

    def remember_preference(self, customer_id: str, preference: str, importance: str = "high"):
        return self.retain_memory(customer_id, preference, category="preference", importance=importance)

    def remember_issue(self, customer_id: str, issue: str, importance: str = "high"):
        return self.retain_memory(customer_id, issue, category="issue", importance=importance)

    def remember_solution(self, customer_id: str, solution: str, importance: str = "high"):
        return self.retain_memory(customer_id, solution, category="solution", importance=importance)

    def remember_order(self, customer_id: str, order_info: str, importance: str = "high"):
        return self.retain_memory(customer_id, order_info, category="order_information", importance=importance)

# Global singleton
hindsight_service = HindsightService()
