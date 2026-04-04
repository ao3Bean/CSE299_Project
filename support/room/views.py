from django.shortcuts import render, get_object_or_404, redirect
from .models import Room
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from django.utils import timezone
from datetime import timedelta
from core.models import UserProfile


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
def rooms_view(request): #django ORM to sql
    #Only show rooms hosted by this user (their saved spaces)
    saved_rooms = Room.objects.filter(host=request.user,is_saved=True).order_by('-created_at')
    temp_rooms = Room.objects.filter(
        host=request.user,
        is_saved=False,
        expires_at__gt=timezone.now()  #calculate expiry for temp rooms, only show if not expired
    ).order_by('-created_at')
    return render(request, 'rooms.html', { #path both for the loops in rooms.html so django can load them
        'rooms': saved_rooms,
        'temp_rooms': temp_rooms
    })


@login_required
def community_view(request):
    # Only show public saved rooms
    public_rooms = Room.objects.filter(is_private=False, is_saved=True).order_by('-created_at') #django orm quesries db w/o sql
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
            is_saved=False,  #changed all rooms are unsaved by default
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

    if request.user == room.host:
        return render(request, 'chatroom.html', {'room': room})
    
    if room.is_private and room.passcode:
        return redirect('verify_passcode', room_id=room_id)
    
    return render(request, 'chatroom.html', {'room': room})

@login_required
@require_POST #blocks any other request
def save_room(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)

    # Only host can save
    if request.user != room.host:
        return JsonResponse({'success': False, 'error': 'Not the host'}, status=403)
    #changing rooms to saved
    room.is_saved = True
    room.expires_at = None  # no expiry once saved
    room.save()

    return JsonResponse({'success': True}) #response for res.js to handle, if success true, show saved message, else show error

@login_required
def verify_passcode(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)

    if not room.is_private or not room.passcode:
        return redirect('chatroom', room_id=room_id)
    
    if request.user == room.host:
        return redirect('chatroom', room_id=room_id)
    
    error = None

    if request.method == 'POST':
        entered_passcode = request.POST.get('passcode', '').strip()
        if entered_passcode == room.passcode:
            return render(request, 'chatroom.html', {'room': room})
        else:
            error = "Incorrect passcode. Please try again."

    return render(request, 'passcode_entry.html', {'room': room, 'error': error})

@login_required
@require_POST
def save_room_settings(request, room_id):
    room = get_object_or_404(Room, room_id=room_id)

    if request.user != room.host:
        return JsonResponse({'success': False, 'error': 'Not the host'}, status=403)

    data = json.loads(request.body)

    bg = data.get('background_preset')
    focus = data.get('focus_duration')
    break_dur = data.get('break_duration')

    if bg:
        room.background_preset = bg
    if focus is not None:
        try:
            room.focus_duration = int(focus)
        except (ValueError, TypeError):
            pass
    if break_dur is not None:
        try:
            room.break_duration = int(break_dur)
        except (ValueError, TypeError):
            pass

    room.save()
    return JsonResponse({'success': True})

def room_full(request):
    return render(request, 'room_full.html')