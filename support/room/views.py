from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def community(request): 
    return render(request, "community.html")

def rooms(request):
    return render(request, "rooms.html")

def chatroom(request): 
    return render(request, "chatroom.html")