from decimal import Decimal

def calc_table_due(table_num: int):
    from orders.models import Order, OrderStatus
    from tables.models import Table
    
    prices = (Order.objects.filter(table_num = table_num)
                .exclude(status__in=[OrderStatus.PAID])
                .values_list("total_price", flat=True))
    total = sum(prices, Decimal("0.00"))

    Table.objects.filter(table_number=table_num).update(amount_due=total)