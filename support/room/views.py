from django.shortcuts import render, get_object_or_404, redirect
from .models import Room
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json

#Create your views here.
def community(request): 
    return render(request, "community.html")

def rooms(request):
    return render(request, "rooms.html")

def chatroom(request): 
    return render(request, "chatroom.html")

def room_detail(request, room_id):
    room_obj = get_object_or_404(Room, room_id=room_id)
    return render(request, "room/room_detail.html", {"room": room_obj})


@login_required
def rooms_view(request):
    #Only show rooms hosted by this user (their saved spaces)
    saved_rooms = Room.objects.filter(host=request.user, is_saved=True) 
    return render(request, 'rooms.html', {'rooms': saved_rooms})


@login_required
def community_view(request):
    # Only show public saved rooms
    public_rooms = Room.objects.filter(is_private=False, is_saved=True) #django orm quesries db w/o sql
    return render(request, 'community.html', {'rooms': public_rooms})


@login_required
def create_room(request):
    if request.method == 'POST': #receives create room form
        data = json.loads(request.body) #reads json file
        room = Room.objects.create( #convert to python dict and create room object in db
            name=data.get('name', 'My Room'),
            description=data.get('description', ''),
            is_private=data.get('is_private', False),
            passcode=data.get('passcode', None),
            host=request.user,
            is_saved=True,  #for now all created rooms are saved
        )
        return JsonResponse({ 
            'success': True, 
            'room_id': str(room.room_id),
            'redirect': f'/room/{room.room_id}/'
        })
    return JsonResponse({'success': False}, status=400)
    #json response for res.js to handle, if success true, redirect to new room page, else show error

@login_required
def chatroom_view(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)
    return render(request, 'chatroom.html', {'room': room})