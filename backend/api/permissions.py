from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """
    Allows access only to authenticated staff users.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and getattr(user, "is_staff", False))

