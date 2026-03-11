from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import UserProfile
from django.contrib import messages


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

#def avatar(request):
    #return render(request, "avatar.html")

#for avatar customization, we will have a default avatar created for each 
# user when they first access the avatar page, which they can then customize and save
DEFAULT_AVATAR = {
    'skin_color': 'skin_1',
    'hair': 'hair_1',
    'face_expression': 'face_1',
    'clothes': 'outfit_1',
}

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