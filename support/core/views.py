from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import UserProfile, Task
from django.contrib import messages
from django.utils import timezone
import json


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

@login_required(login_url="login")
def friends(request): 
    return render(request, "friends.html")

#@login_required(login_url="login")
#def user_profile(request):
    #return render(request, "user_profile.html")



@login_required(login_url="login")
def user_profile(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults=DEFAULT_AVATAR
    )
    return render(request, "user_profile.html", {'profile': profile})

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