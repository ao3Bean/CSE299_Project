from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required


# Create your views here.
#@login_required(login_url="login")
def index(request):
    return render (request, "index.html")

#def login(request):
    #return render(request, "login.html")

@login_required(login_url="login")
def user_dashboard(request):
    return render(request, "user_dashboard.html")

@login_required(login_url="login")
def settings_view(request):
    return render(request, "settings.html")

@login_required(login_url="login")
def focus(request):
    return render(request, "focus.html")

@login_required(login_url="login")
def tasks(request): 
    return render(request, "tasks.html")

@login_required(login_url="login")
def friends(request): 
    return render(request, "friends.html")

@login_required(login_url="login")
def user_profile(request):
    return render(request, "user_profile.html")