#represent the different urls that go to the different views in the core app
#similar to php header but more organized and easier to maintain
from django.urls import URLPattern, path
from . import views

#list for all the urls that the user can navigate from core app 
urlpatterns = [  
    path('', views.index, name='index'), #when the url is empty, go to the index view
    #path('login/', views.login, name='login'), #login/signup view
    path('user_dashboard/', views.user_dashboard, name='user_dashboard'), #login/signup view
    #path('url_name/', views.view_function_name, name='url_name')
    #so from '' it goes to index than we can redirect to v1/
    path("settings/", views.settings_view, name="settings"),
    path('focus/', views.focus, name='focus'),
    path('tasks/', views.tasks, name='tasks'),
    #path('friends/', views.friends, name='friends'),
    path("profile/", views.user_profile, name="user_profile"),
    #path('avatar/', views.avatar, name='avatar'),
    path('avatar/', views.avatar, name='avatar'),
    path('avatar/customize/', views.avatar_customization, name='avatar_customization'),
    path('tasks/add/', views.add_task, name='add_task'),
    path('tasks/toggle/<int:task_id>/', views.toggle_task, name='toggle_task'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/pic/', views.edit_profile_pic, name='edit_profile_pic'),
    path('friends/', views.friends, name='friends'),
    path('friends/add/', views.send_friend_request, name='send_friend_request'),
    path('friends/accept/<int:friendship_id>/', views.accept_friend_request, name='accept_friend_request'),
    path('friends/decline/<int:friendship_id>/', views.decline_friend_request, name='decline_friend_request'),
    path('friends/remove/<int:friend_id>/', views.remove_friend, name='remove_friend'),
    path('friends/send-link/', views.send_room_link, name='send_room_link'),
]