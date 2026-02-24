from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),


    # password reset
    path("password-reset/", views.password_reset, name="password_reset"),
    path("password-reset-confirm/", views.password_reset_confirm, name="password_reset_confirm"),
]