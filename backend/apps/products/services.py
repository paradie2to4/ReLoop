"""Rule-based exchange recommendation engine.

Deliberately simple and explainable (no ML): every candidate product is
scored against the product being viewed using a handful of weighted rules,
and the reasons behind the score are returned so the UI can show *why*
something was recommended (e.g. "Same category", "Similar value").
"""

from .models import Product

CONDITION_RANK = {
    Product.Condition.NEW: 5,
    Product.Condition.LIKE_NEW: 4,
    Product.Condition.GOOD: 3,
    Product.Condition.FAIR: 2,
    Product.Condition.NEEDS_REPAIR: 1,
}

EXCHANGEABLE_TYPES = (Product.TransactionType.FOR_EXCHANGE, Product.TransactionType.SALE_OR_EXCHANGE)


def get_exchange_recommendations(product, limit=8):
    """Return up to `limit` products a user might reasonably swap `product`
    for, ranked highest score first. Each result is
    ``{"product": Product, "score": int, "reasons": [str, ...]}``.
    """
    candidates = (
        Product.objects.filter(status=Product.Status.ACTIVE, transaction_type__in=EXCHANGEABLE_TYPES)
        .exclude(id=product.id)
        .exclude(seller_id=product.seller_id)
        .select_related("category", "seller")
        .prefetch_related("images")
    )

    scored = []
    for candidate in candidates:
        score = 0
        reasons = []

        if candidate.category_id == product.category_id:
            score += 40
            reasons.append("Same category")

        if product.price and candidate.price:
            higher = max(product.price, candidate.price)
            diff_ratio = abs(candidate.price - product.price) / higher if higher else 1
            if diff_ratio <= 0.15:
                score += 30
                reasons.append("Similar value")
            elif diff_ratio <= 0.35:
                score += 15
                reasons.append("Comparable value")

        cand_rank = CONDITION_RANK.get(candidate.condition, 0)
        prod_rank = CONDITION_RANK.get(product.condition, 0)
        if cand_rank == prod_rank:
            score += 15
            reasons.append("Similar condition")
        elif abs(cand_rank - prod_rank) == 1:
            score += 7

        if candidate.location and product.location and (
            candidate.location.strip().lower() == product.location.strip().lower()
        ):
            score += 15
            reasons.append("Same location")

        if score > 0:
            scored.append({"product": candidate, "score": score, "reasons": reasons})

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:limit]
