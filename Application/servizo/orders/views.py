from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_POST, require_GET
from django.http import JsonResponse
from helpers.utils import parse_json
from helpers.responses import bad_request, success, not_found, created_response
from .models import Order, OrderStatus
from .utils import serialize_order
from bson import ObjectId
from menu.models import MenuItem


@csrf_exempt
@require_GET
def unpaid_orders_view(request, table_num: int):
    from tables.models import Table
    table = Table.objects.get(table_number=table_num)
    unpaid_orders = table.unpaid_orders

    data = [serialize_order(order) for order in unpaid_orders]

    return JsonResponse({"orders": data})


@csrf_protect
@require_POST
def pay_table(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")

    table_num = body.get("table_num")
    if not table_num:
        return bad_request("Table number is required!")

    from tables.models import Table
    try:
        table = Table.objects.get(table_number=table_num)
    except Table.DoesNotExist:
        return not_found("Table not found")

    count = table.pay_all_orders()
    if count:
        return success(f"Number of orders paid for table {table_num}: {count}")
    else:
        return success(f"No unpaid orders for table {table_num}")


@csrf_protect
@require_POST
def pay_order(request, order_id: str):
    try:
        order = Order.objects.get(id=ObjectId(order_id))
    except Order.DoesNotExist:
        return not_found("Order not found")

    if order.pay():
        return success(f"Order {order_id} at table {order.table_num} successfully paid!")
    else:
        return success(f"Order {order_id} already paid.")


@csrf_protect
@require_POST
def make_order(request, table_num: int):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")

    items = body.get("items")

    item_ids = []

    for item_entry in items:
        try:
            quantity = item_entry.get("quantity")
            item_id = item_entry.get("id")

            itemObj = MenuItem.objects.get(id=ObjectId(item_id))
            if not itemObj.available:
                return bad_request(f"{itemObj.name} is currently unavailable")

            item_ids.extend([itemObj.id]*quantity)
        except MenuItem.DoesNotExist:
            return not_found(f"Item {item_entry.get('id')} not found")

    order = Order(table_num=table_num, items=item_ids)
    order.save()

    return created_response("Order placed", str(order.id))


@require_GET
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return not_found("Order not found")

    if order.status == OrderStatus.PAID:
        return bad_request("Cannot cancel a paid order")

    order.cancel()
    return success("Order cancelled")


@require_GET
def get_order(request, order_id: str):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return not_found(f"Order {order_id} not found")

    items = order.get_order_items()

    data = {
        "id": str(order.id),
        "items": [{"name": item.name, "price": item.price} for item in items],
        "table_num": order.table_num,
        "total_price": str(order.total_price),
        "ordered_at": order.ordered_at,
        "status": order.status,
        "paid_at": order.paid_at,
    }
    return success(data)


@csrf_protect
@require_POST
def remove_item(request, order_id: str):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return not_found(f"Order {order_id} not found")

    body = parse_json(request)
    item_id = body.get("item_id")
    if not item_id:
        return bad_request("Missing item_id")

    try:
        order.items.remove(item_id)  # ovo ce da ukloni jedno povaljivanje
    except ValueError:
        return not_found(f"Item {item_id} not found in order {order_id}")

    order.save()
    return success({
        "id": str(order.id),
        "items": [str(i) for i in order.items],
        "table_num": order.table_num,
        "total_price": str(order.total_price),
        "ordered_at": order.ordered_at,
        "paid_at": order.paid_at,
    })


@csrf_protect
@require_POST
def add_item(request, order_id: str):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return not_found(f"Order {order_id} not found")

    body = parse_json(request)
    item_id = body.get("item_id")
    if not item_id:
        return bad_request("Missing item_id")

    try:
        oid = ObjectId(item_id)
    except Exception:
        return bad_request("Invalid item_id")

    order.items.append(oid)
    order.save()

    data = {
        "id": str(order.id),
        "items": [{"$oid": str(i)} for i in order.items],
        "table_num": order.table_num,
        "total_price": str(order.total_price),
        "ordered_at": order.ordered_at.isoformat() if order.ordered_at else None,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
    }
    return success(data)
