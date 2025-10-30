from django.http import JsonResponse


def bad_request(detail: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"detail": detail}, status=status)


def created_response(detail: str, id=None, **extra) -> JsonResponse:
    payload = {"detail": detail, "id": id}
    payload.update(extra)
    return JsonResponse(payload, status=201)


def unauthorized(detail: str = "Unauthorized") -> JsonResponse:
    return JsonResponse({"detail": detail}, status=401)


def success(detail: str) -> JsonResponse:
    return JsonResponse({"detail": detail}, status=200)


def not_found(detail: str) -> JsonResponse:
    return JsonResponse({"detail": detail}, status=404)