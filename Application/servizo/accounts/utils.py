from django.contrib.auth import get_user_model

User = get_user_model()

def resolve_username(identifier):
    if "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        return user.username if user else None
    
    return identifier


def get_user_by_identifier(identifier):
    if "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
    else:
        user = User.objects.filter(username__iexact=identifier).first()
    
    return user if user else None
