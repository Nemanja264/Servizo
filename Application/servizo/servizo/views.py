from pathlib import Path
from django.conf import settings
from django.http import Http404, HttpResponse

def spa_view(request):
    table = request.GET.get("table")
    if table and table.isdigit():
        request.session["table_num"] = int(table) 

    built_index = Path(settings.BASE_DIR) / "frontend" / "static" / "react" / "index.html"
    if not built_index.exists():
        raise Http404("React build not found. Run: cd frontend/react && npm run build")
    return HttpResponse(built_index.read_text(encoding="utf-8"), content_type="text/html")
