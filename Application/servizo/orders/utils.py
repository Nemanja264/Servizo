from collections import Counter
from menu.models import MenuItem


def serialize_order(order):
    counts = Counter(order.items)

    items = MenuItem.objects.filter(id__in=counts.keys())

    item_details = []
    for item in items:
        item_details.append({
            "id": str(item.id),
            "name": item.name,
            "price": str(item.price),
            "quantity": counts[item.id],
        })

    return {
        "id": str(order.id),
        "status": order.status,
        "ordered_at": order.ordered_at.isoformat(),
        "total_price": str(order.total_price),
        "items": item_details,
    }
