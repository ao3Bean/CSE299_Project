from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
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
                return render(request, "login.html")

        elif form_type == "signup":
            username = request.POST.get("username")
            email = request.POST.get("email")
            password = request.POST.get("password")

            if User.objects.filter(username=username).exists():
                messages.error(request, "Username already taken.")
                return render(request, "login.html")

            user = User.objects.create_user(username=username, email=email, password=password)
            auth_login(request, user)
            messages.success(request, f"Account created! Welcome, {username}!")
            return redirect("user_dashboard")

    return render(request, "login.html")


def logout(request):
    auth_logout(request)
    messages.info(request, "You've been logged out.")
    return redirect("login")


def password_reset(request):
    if request.method == "POST":
        email = request.POST.get("email")
        try:
            user = User.objects.get(email=email)
            request.session["reset_user_id"] = user.id
            messages.success(request, "Email found! Please set your new password.")
            return redirect("password_reset_confirm")
        except User.DoesNotExist:
            messages.error(request, "No account found with that email.")
            return render(request, "password_reset.html")
    return render(request, "password_reset.html")


def password_reset_confirm(request):
    user_id = request.session.get("reset_user_id")
    if not user_id:
        messages.error(request, "Session expired. Please try again.")
        return redirect("password_reset")
    if request.method == "POST":
        password1 = request.POST.get("new_password1")
        password2 = request.POST.get("new_password2")
        if password1 != password2:
            messages.error(request, "Passwords don't match.")
            return render(request, "password_reset_confirm.html")
        if len(password1) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return render(request, "password_reset_confirm.html")
        user = User.objects.get(id=user_id)
        user.password = make_password(password1)
        user.save()
        del request.session["reset_user_id"]
        messages.success(request, "Password reset successfully! Please login.")
        return redirect("login")
    return render(request, "password_reset_confirm.html")