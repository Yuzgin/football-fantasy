from django.contrib import admin
from django.urls import path, include
from api.views import CreateUserView, PasswordResetRequestView, PasswordResetConfirmView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("api/admin/", admin.site.urls),
    path("api/user/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api-auth/", include("rest_framework.urls")),
    path("api/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/reset-password/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("api/", include("api.urls")),
]
