from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages


def login(request):
    if request.method == "POST":
        form_type = request.POST.get("form_type")

        if form_type == "login":
            username = request.POST.get("username")
            password = request.POST.get("password")
            user = authenticate(request, username=username, password=password)
            if user is not None:
                auth_login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect("user_dashboard")
            else:
                messages.error(request, "Invalid username or password.")
                return redirect("login")

        elif form_type == "signup":
            username = request.POST.get("username")
            email = request.POST.get("email")
            password = request.POST.get("password")

            if User.objects.filter(username=username).exists():
                messages.error(request, "Username already taken.")
                return redirect("login")

            user = User.objects.create_user(username=username, email=email, password=password)
            auth_login(request, user)
            messages.success(request, f"Account created! Welcome, {username}!")
            return redirect("user_dashboard")

    return render(request, "login.html")


def logout(request):
    auth_logout(request)
    messages.info(request, "You've been logged out.")
    return redirect("login")

# Create your views here.
