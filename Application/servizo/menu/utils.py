from .models import MenuCategory

def get_parent_path(pid):
    if not pid:
        return None
    return MenuCategory.objects.only("path").get(id=pid).path

def reparent_descendants_for_delete(descendants, category):
    new_parent_id = category.parent
    path_by_id = {}

    descendants.sort(key=lambda d: len(d.ancestors))

    for d in descendants:
        d.ancestors.remove(category.id)

        if d.parent == category.id:
            d.parent = new_parent_id

        parent_path = None
        if d.parent:
            parent_path = MenuCategory.objects.only("path").get(id=d.parent).path

        d.path = f"{parent_path}/{d.name}" if parent_path else d.name

        d.save(update_fields=["ancestors", "parent", "path"])
        path_by_id[d.id] = d.path

def reparent_descendants_for_update(descendants, category):
    descendants.sort(key=lambda d: len(d.ancestors))

    for d in descendants:
        if category.id in d.ancestors:
            i = d.ancestors.index(category.id)
            tail = d.ancestors[i+1:]
            d.ancestors = list(category.ancestors) + [category.id] + tail

        parent_path = get_parent_path(d.parent)
        d.path = f"{parent_path}/{d.name}" if parent_path else d.name
        d.save(update_fields=["ancestors", "path"])