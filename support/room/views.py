from django.shortcuts import render, get_object_or_404, redirect
from .models import Room, RoomMembership
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json 
from django.contrib.auth.models import User


# Create your views here.
def community(request): 
    return render(request, "community.html")

def rooms(request):
    rooms_qs = Room.objects.order_by("-created_at")
    return render(request, "rooms.html", {"rooms": rooms_qs})

def chatroom(request): 
    return render(request, "chatroom.html")

def room_detail(request, room_id):
    room_obj = get_object_or_404(Room, room_id=room_id)
    return render(request, "room/room_detail.html", {"room": room_obj})


@login_required
def rooms_view(request):
    # Only show rooms hosted by this user (their saved spaces)
    saved_rooms = Room.objects.filter(host=request.user, is_saved=True)
    return render(request, 'rooms.html', {'rooms': saved_rooms})


@login_required
def community_view(request):
    # Only show public saved rooms
    public_rooms = Room.objects.filter(is_private=False, is_saved=True)
    return render(request, 'community.html', {'rooms': public_rooms})


@login_required
def create_room(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        room = Room.objects.create(
            name=data.get('name', 'My Room'),
            description=data.get('description', ''),
            is_private=data.get('is_private', False),
            passcode=data.get('passcode', None),
            host=request.user,
            is_saved=True,  # for now all created rooms are saved
        )
        return JsonResponse({
            'success': True,
            'room_id': str(room.room_id),
            'redirect': f'/room/{room.room_id}/'
        })
    return JsonResponse({'success': False}, status=400)


@login_required
def chatroom_view(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)

    participants = User.objects.filter(
        roommembership__room=room
    ).distinct()

    messages = room.messages.select_related("sender").all()

    return render(request, 'chatroom.html', {
        'room': room,
        'participants': participants,
        'messages': messages,
    })