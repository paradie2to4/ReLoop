from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsSeller(BasePermission):
    """Allows write access only to accounts that have enabled selling."""

    message = "You need to become a seller before you can list products."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_seller)


class IsOwnerOrReadOnly(BasePermission):
    """Object-level permission: only the owner may edit/delete."""

    owner_field = "seller"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user or request.user.is_staff


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
