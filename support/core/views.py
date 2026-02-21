from django.shortcuts import render
from django.http import HttpResponse



# Create your views here.
def index(request):
    return render (request, "index.html")

def login(request):
    return render(request, "login.html")

def user_dashboard(request):
    return render(request, "user_dashboard.html")

def settings_view(request):
    return render(request, "settings.html")

def rooms(request):
    return render(request, "rooms.html")

def focus(request):
    return render(request, "focus.html")

def tasks(request): 
    return render(request, "tasks.html")

def community(request): 
    return render(request, "community.html")

def friends(request): 
    return render(request, "friends.html")

def user_profile(request):
    return render(request, "user_profile.html")