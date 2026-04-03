from django.shortcuts import render, redirect
from django.http import HttpResponse,JsonResponse
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Task, Friendship, RoomLinkMessage
from django.contrib import messages
from django.utils import timezone
from datetime import date          # ← NEW: for today's date
from collections import Counter    # ← NEW: for counting most productive day
import json
from django.views.decorators.http import require_POST
from django.db.models import Q
from django.contrib.auth.models import User



# Create your views here.

# DEFAULT_AVATAR must be defined BEFORE any view that uses it, otherwise it will cause an 
# error when trying to create a new UserProfile without providing all fields
DEFAULT_AVATAR = {
    'skin_color': 'skin_1',
    'hair': 'hair_1',
    'face_expression': 'face_1',
    'clothes': 'outfit_1',
}

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

#@login_required(login_url="login")#we're having it in the calendar part 
#def tasks(request): 
    #return render(request, "tasks.html")

#@login_required(login_url="login")
#def friends(request): 
    #return render(request, "friends.html")

#@login_required(login_url="login")
#def user_profile(request):
    #return render(request, "user_profile.html")



@login_required(login_url="login")
def user_profile(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )


    # ── Task Analytics ────────────────────────────────
    today = date.today()

    # get all tasks for this user this month
    monthly_tasks = Task.objects.filter(
        user=request.user,
        date__year=today.year,
        date__month=today.month
    )

    # count total, completed and incomplete tasks this month
    total_tasks      = monthly_tasks.count()
    completed_tasks  = monthly_tasks.filter(is_complete=True).count()
    incomplete_tasks = total_tasks - completed_tasks

    # completion rate as a percentage (avoid division by zero)
    completion_rate = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

    # most productive day — day with most completed tasks this month
    completed_dates = monthly_tasks.filter(
        is_complete=True
    ).values_list('date', flat=True)

    most_productive_day = None
    if completed_dates:
        day_counts   = Counter(completed_dates)
        busiest_date = max(day_counts, key=day_counts.get)
        most_productive_day = busiest_date.strftime("%B %d")  # e.g. "March 20"

    # ── Yearly Analytics (for pie chart) ─────────────
    # get all tasks for this user this year
    yearly_tasks = Task.objects.filter(
        user=request.user,
        date__year=today.year
    )

    yearly_total      = yearly_tasks.count()
    yearly_completed  = yearly_tasks.filter(is_complete=True).count()
    yearly_incomplete = yearly_total - yearly_completed
    # ── End Analytics ─────────────────────────────────

    return render(request, "user_profile.html", {
        'profile':             profile,
        # monthly stats
        'total_tasks':         total_tasks,
        'completed_tasks':     completed_tasks,
        'incomplete_tasks':    incomplete_tasks,
        'completion_rate':     completion_rate,
        'most_productive_day': most_productive_day or "No data yet",
        # yearly stats for pie chart
        'yearly_completed':    yearly_completed,
        'yearly_incomplete':   yearly_incomplete,
        'yearly_total':        yearly_total,
    })

    #return render(request, "user_profile.html", {'profile': profile})

#def avatar(request):
    #return render(request, "avatar.html")

#for avatar customization, we will have a default avatar created for each 
# user when they first access the avatar page, which they can then customize and save


@login_required(login_url="login")
def avatar(request):
    # just display saved avatar
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )

    

    return render(request, "avatar.html", {'profile': profile})

@login_required(login_url="login")
def avatar_customization(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )
    if request.method == "POST":
        profile.skin_color      = request.POST.get('skin_color', DEFAULT_AVATAR['skin_color'])
        profile.hair            = request.POST.get('hair', DEFAULT_AVATAR['hair'])
        profile.face_expression = request.POST.get('face_expression', DEFAULT_AVATAR['face_expression'])
        profile.clothes         = DEFAULT_AVATAR['clothes']  # only 1 outfit
        profile.save()
        messages.success(request, "Avatar saved!")
        return redirect('user_profile')
    return render(request, "avatar_customization.html", {'profile': profile})


# ── NEW: edit profile view ────────────────────────────
# handles editing hobbies and focus goal
# GET  → loads current values into the edit form
# POST → saves new values to db → redirects to profile
@login_required(login_url="login")
def edit_profile(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )
    if request.method == "POST":
        # save hobbies and focus goal from form
        profile.hobbies    = request.POST.get('hobbies', '')
        profile.focus_goal = request.POST.get('focus_goal', '')
        profile.save()
        messages.success(request, "Profile updated!")
        return redirect('user_profile')  # go back to profile after saving
    # GET → render edit form with current values
    return render(request, "edit_profile.html", {'profile': profile})
# ── END NEW ──────────────────────────────────────────


# ── NEW: profile picture selection view ──
# GET  → shows preset profile pic options
# POST → saves selected pic to db → redirects to profile
@login_required(login_url="login")
def edit_profile_pic(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )
    if request.method == "POST":
        # save selected profile pic filename
        profile.profile_pic = request.POST.get('profile_pic', 'profile_pic.png')
        profile.save()
        messages.success(request, "Profile picture updated!")
        return redirect('user_profile')
    return render(request, "profile_pic.html", {'profile': profile})
# ── END NEW ──

#for calendar (task-> to-do list)
@login_required(login_url="login")
def tasks(request):
    # get all tasks for this user
    user_tasks = Task.objects.filter(user=request.user)
    
    # group tasks by date for the calendar
    tasks_by_date = {}
    for task in user_tasks:
        date_str = str(task.date)
        if date_str not in tasks_by_date:
            tasks_by_date[date_str] = []
        tasks_by_date[date_str].append({
            'id': task.id,
            'title': task.title,
            'is_complete': task.is_complete,
        })
    
    return render(request, "tasks.html", {
        'tasks_by_date': json.dumps(tasks_by_date),  # pass to JS
    })

@login_required(login_url="login")
def add_task(request):
    if request.method == "POST":
        title = request.POST.get('title')
        date  = request.POST.get('date')
        Task.objects.create(user=request.user, title=title, date=date)
        return redirect('tasks')
    return redirect('tasks')

@login_required(login_url="login")
def toggle_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.is_complete = not task.is_complete
        task.save()
    except Task.DoesNotExist:
        pass
    return redirect('tasks')

#Friends page views
@login_required(login_url="login")
def friends(request):
    me = request.user

    # accepted friends (either direction)
    accepted = Friendship.objects.filter(
        status='accepted'
    ).filter(
        Q(from_user=me) | Q(to_user=me)
    )
    friends_list = []
    for f in accepted:
        friend = f.to_user if f.from_user == me else f.from_user
        profile, _ = UserProfile.objects.get_or_create(user=friend, defaults=DEFAULT_AVATAR)
        friends_list.append({'user': friend, 'profile': profile})

    # pending requests sent TO me
    incoming = Friendship.objects.filter(to_user=me, status='pending')
    requests_list = []
    for f in incoming:
        profile, _ = UserProfile.objects.get_or_create(user=f.from_user, defaults=DEFAULT_AVATAR)
        requests_list.append({'friendship': f, 'user': f.from_user, 'profile': profile})

    # received room links(old)

    #received_links = RoomLinkMessage.objects.filter(receiver=me).order_by('-sent_at')

    #return render(request, "friends.html", {
        #'friends_list':   friends_list,
        #'requests_list':  requests_list,
        #'received_links': received_links,
    #})


    # NEW: split link and passcode before passing to template
    received_links_raw = RoomLinkMessage.objects.filter(receiver=me).order_by('-sent_at')
    received_links = []
    for msg in received_links_raw:
        if ' [passcode:' in msg.room_link:
            parts    = msg.room_link.split(' [passcode:')
            link     = parts[0]
            passcode = parts[1][:-1]  # ← remove trailing ]
        else:
            link     = msg.room_link
            passcode = ''
        received_links.append({
            'sender':   msg.sender,
            'link':     link,
            'passcode': passcode,
        })

    return render(request, "friends.html", {
        'friends_list':   friends_list,
        'requests_list':  requests_list,
        'received_links': received_links,
    })


@login_required(login_url="login")
@require_POST
def send_friend_request(request):
    username = request.POST.get('username', '').strip()
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': f'No user found with username "{username}"'})

    if target == request.user:
        return JsonResponse({'ok': False, 'error': "You can't add yourself!"})

    # check if already friends or request exists
    exists = Friendship.objects.filter(
        Q(from_user=request.user, to_user=target) |
        Q(from_user=target, to_user=request.user)
    ).first()

    if exists:
        if exists.status == 'accepted':
            return JsonResponse({'ok': False, 'error': f'You are already friends with {username}!'})
        else:
            return JsonResponse({'ok': False, 'error': f'Friend request already sent to {username}!'})

    Friendship.objects.create(from_user=request.user, to_user=target, status='pending')
    return JsonResponse({'ok': True, 'message': f'Friend request sent to {username}!'})


@login_required(login_url="login")
@require_POST
def accept_friend_request(request, friendship_id):
    try:
        f = Friendship.objects.get(id=friendship_id, to_user=request.user, status='pending')
        f.status = 'accepted'
        f.save()
        return JsonResponse({'ok': True})
    except Friendship.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'Request not found'})


@login_required(login_url="login")
@require_POST
def decline_friend_request(request, friendship_id):
    try:
        f = Friendship.objects.get(id=friendship_id, to_user=request.user, status='pending')
        f.delete()
        return JsonResponse({'ok': True})
    except Friendship.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'Request not found'})


@login_required(login_url="login")
@require_POST
def remove_friend(request, friend_id):
    try:
        target = User.objects.get(id=friend_id)
        f = Friendship.objects.filter(
            Q(from_user=request.user, to_user=target) |
            Q(from_user=target, to_user=request.user),
            status='accepted'
        ).first()
        if f:
            f.delete()
        return JsonResponse({'ok': True})
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'User not found'})


@login_required(login_url="login")
@require_POST
def send_room_link(request):
    username  = request.POST.get('username', '').strip()
    room_link = request.POST.get('room_link', '').strip()
    passcode  = request.POST.get('passcode', '').strip()  # ← NEW: grab passcode
    try:
        receiver = User.objects.get(username=username)
        RoomLinkMessage.objects.create(
            sender=request.user,
            receiver=receiver,
            #room_link=room_link
            #room_link=room_link + (f' | 🔑 {passcode}' if passcode else '')  # ← NEW: append passcode if exists
            room_link=room_link + (f' [passcode:{passcode}]' if passcode else '')  # ← simpler separator
        )
        return JsonResponse({'ok': True, 'message': 'Link sent!'})
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'User not found'})