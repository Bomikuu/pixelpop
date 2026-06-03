# api/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrReadOnly(BasePermission):
    """
    - Public endpoints should not use this.
    - Admin CRUD endpoints can use this if you ever want read-only for non-staff.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
