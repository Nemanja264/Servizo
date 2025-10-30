from django.views.decorators.http import require_GET, require_POST, require_http_methods
from helpers.responses import created_response, success, bad_request, not_found
from .models import Table
from django.views.decorators.csrf import csrf_exempt, csrf_protect


@csrf_protect
@require_POST
def add_table(request, table_number: int):
    if Table.objects.filter(table_number=table_number).exists():
        return bad_request("Table already exists")

    table = Table.objects.create(table_number=table_number)
    return created_response("Table added", str(table.id))


@csrf_protect
@require_POST
def add_next_table(request):
    last_added_table = Table.objects.order_by('-table_number').first()

    if last_added_table is None:
        table_number = 1
    else:
        table_number = last_added_table.table_number + 1
    table = Table.objects.create(table_number=table_number)
    return created_response("Table added", str(table.id))


@require_GET
def get_tables(request):
    tables = Table.objects.all()
    data = [{"id": str(t.id), "table_number": t.table_number,
             "amount_due": str(t.amount_due)} for t in tables]
    return success(data)


@require_GET
def get_table(request, table_number: int):
    try:
        table = Table.objects.get(table_number=table_number)
    except Table.DoesNotExist:
        return not_found(f"Table {table_number} not found")

    data = {
        "id": str(table.id),
        "table_number": table.table_number,
        "amount_due": str(table.amount_due)
    }
    return success(data)


@csrf_protect
@require_http_methods(["DELETE"])
def remove_table(request, table_number: int):
    try:
        table = Table.objects.get(table_number=table_number)
        table.delete()

        return success(f"Table number {table_number} deleted.")
    except Table.DoesNotExist:
        return not_found("Table doesnt exist")
