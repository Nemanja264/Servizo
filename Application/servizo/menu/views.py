from django.views.decorators.http import require_POST, require_GET, require_safe, require_http_methods
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from helpers.responses import bad_request, created_response, not_found, success
from .models import MenuItem, MenuCategory
from .utils import reparent_descendants_for_delete, reparent_descendants_for_update
from helpers.utils import parse_json
from django.http import JsonResponse
from decimal import Decimal
from bson import ObjectId
from bson.errors import InvalidId


from accounts.views import require_auth


@require_POST
def add_category(request):
    data = parse_json(request)
    if data is None:
        return bad_request("Invalid JSON body")

    name = data.get("name")
    parent_id = data.get("parent_id")

    parent = None
    ancestors = []
    path = name

    if parent_id:
        try:
            parent_id = ObjectId(parent_id)
            parent = MenuCategory.objects.get(id=parent_id)
            ancestors = parent.ancestors + [parent.id]
            path = f"{parent.path}/{name}"
        except MenuCategory.DoesNotExist:
            return not_found("Parent category not found")

    category = MenuCategory.objects.create(
        name=name, parent=parent_id, path=path, ancestors=ancestors)
    return created_response("Category added", id=str(category.id))


@require_POST
def add_menu_item(request):
    data = parse_json(request)
    if data is None:
        return bad_request("Invalid JSON body")

    name = data.get("name")
    category_id = data.get("category_id")
    price = data.get("price")
    description = data.get("description", None)

    try:
        category = MenuCategory.objects.get(id=ObjectId(category_id))
    except MenuCategory.DoesNotExist:
        return not_found("Category not found")

    item = MenuItem.objects.create(
        name=name,
        category_id=category.id,
        price=price,
        description=description
    )
    return created_response("Menu_item added", id=str(item.id))


@require_safe
def get_menu_items(request):
    items = MenuItem.objects.all()
    data = [{
        "id": str(i.id),
        "name": i.name,
        "category": i.category_name,
        "category_id": str(i.category_id),
        "price": str(i.price),
        "available": i.available,
        "description": i.description,
        "last_updated": i.last_updated,
    } for i in items]
    return JsonResponse(data, safe=False)


@require_GET
def get_categories(request):
    categories = MenuCategory.objects.all()
    data = [{
        "id": str(c.id),
        "name": c.name,
        "path": c.path,
        "parent": str(c.parent) if c.parent else None
    } for c in categories]
    return JsonResponse(data, safe=False)


@require_GET  # by name, change later by id
def get_items_by_category(request, category_name: str):
    try:
        category = MenuCategory.objects.get(name=category_name)
    except MenuItem.DoesNotExist:
        return not_found("Category not found")

    items = MenuItem.objects.filter(category_id=category.id)
    data = [{
        "id": str(i.id),
        "name": i.name,
        "price": str(i.price),
        "description": i.description,
        "available": i.available,
    } for i in items]
    return success(data)

@csrf_protect
@require_POST
def update_price(request, item_id: str):
    data = parse_json(request)
    if data is None:
        return bad_request("Invalid JSON body")

    new_price = data.get("price")

    if not item_id or new_price is None:
        return bad_request("Fields 'item_id' and 'price' are required")

    try:
        oid = ObjectId(item_id)
    except (InvalidId, TypeError):
        return bad_request("Invalid 'item_id'")

    try:
        dec_price = Decimal(str(new_price))
    except Exception:
        return bad_request("Invalid 'price' format")

    if dec_price < 0:
        return bad_request("Price must be non-negative")

    try:
        item = MenuItem.objects.get(id=oid)
    except MenuItem.DoesNotExist:
        return not_found("Item not found")

    item.price = dec_price
    item.save(update_fields=["price"])

    return success(f"Price for item {item.id} updated to {item.price}")


@require_auth
@csrf_protect
@require_POST
def update_category(request, category_id: str):
    data = parse_json(request)
    if data is None:
        return bad_request("Invalid JSON body")

    try:
        cat = MenuCategory.objects.get(id=ObjectId(category_id))
    except MenuCategory.DoesNotExist:
        return not_found("Category not found")

    fields = []
    new_name = data.get("new_name")
    if new_name:
        cat.name = new_name
        fields.append("name")

    descendants = None
    new_pid = data.get("parent_id")
    if new_pid:
        try:
            new_pid = ObjectId(new_pid)
            new_parent = MenuCategory.objects.get(id=new_pid)
        except InvalidId:
            return bad_request("Invalid category_id")
        
        old_prefix = f"{cat.path}/"
        descendants = list(MenuCategory.objects.filter(path__startswith=old_prefix))

        if new_parent.path.startswith(old_prefix):
                return bad_request("Cannot move under own subtree")
            
        if cat.parent != new_parent.id:
                cat.parent = new_parent.id
                cat.ancestors = list(new_parent.ancestors) + [new_parent.id]
                fields.extend(["parent", "ancestors"])
            
    parent_path = MenuCategory.objects.only("path").get(id=cat.parent).path if cat.parent else None
    new_path = f"{parent_path}/{cat.name}" if parent_path else cat.name
    if new_path != cat.path:
        cat.path = new_path
        fields.append("path")

    if fields:
        cat.save(update_fields=fields)

    if descendants and fields:
        reparent_descendants_for_update(descendants, cat)

    return success(f"Category {cat.name} updated")


@require_auth
@csrf_protect
@require_POST
def update_item(request, item_id: str):
    data = parse_json(request)
    if data is None:
        return bad_request("Invalid JSON body")
    
    fields = []

    try:
        item_id = ObjectId(item_id)
    except InvalidId:
        return bad_request("Invalid 'item_id'")

    try:
        item = MenuItem.objects.get(id=item_id)
    except MenuItem.DoesNotExist:
        return not_found("Item not found")

    if "name" in data and data["name"]:
        item.name = data["name"]
        fields.append("name")

    if "description" in data:
        item.description = data["description"]
        fields.append("description")

    if "available" in data:
        item.available = bool(data["available"])
        fields.append("available")

    if "category_id" in data:
        cat_val = data["category_id"]
        if cat_val in (None, "", "null"):
            item.category_id = None
        else:
            try:
                new_cid = ObjectId(cat_val)
            except (InvalidId, TypeError):
                return bad_request("Invalid 'category_id'")

            if not MenuCategory.objects.filter(id=new_cid).exists():
                return not_found("Target category not found")
            
            item.category_id = new_cid
            fields.append("category_id")

    item.save(update_fields=fields)
    return success(f"Item {item.id} updated")

@csrf_protect
@require_http_methods(["DELETE"])
def remove_category(request, category_id: str):
    try:
        category_oid = ObjectId(category_id)
    except InvalidId:
        return bad_request("Invalid category_id")

    try:
        category = MenuCategory.objects.get(id=category_oid)
    except MenuCategory.DoesNotExist:
        return not_found("Category doesn't exist")

    old_prefix = f"{category.path}/"
    descendants = list(MenuCategory.objects.filter(path__startswith=old_prefix))

    if descendants:
        reparent_descendants_for_delete(descendants, category)

    MenuItem.objects.filter(category_id=category.id).delete()

    category.delete()
    return success(f"Category {category_id} deleted and descendants reparented.")

@csrf_protect
@require_http_methods(["DELETE"])
def remove_item(request, item_id: str):
    try:
        item = MenuItem.objects.get(id=item_id)
        item.delete()

        return success(f"Menu item {item_id} deleted.")
    except MenuItem.DoesNotExist:
        return not_found("Menu item doesnt exist")


@csrf_protect
@require_POST
def set_unavailable(request, item_id: str):
    try:
        item_id = ObjectId(item_id)
    except InvalidId:
        return bad_request("Invalid 'item_id'")

    try:
        item = MenuItem.objects.get(id=item_id)
    except MenuItem.DoesNotExist:
        return not_found("Menu item not found!")

    item.available = False
    item.save(update_fields=['available'])

    return success(f"{item_id} set to unavailable")

# delete category, delete item # Nemanja
