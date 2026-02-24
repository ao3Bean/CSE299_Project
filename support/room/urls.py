from django.urls import URLPattern, path
from . import views    

urlpatterns = [
    path('rooms/', views.rooms, name='rooms'),
    path('community/', views.community, name='community'),
    path('chatroom/', views.chatroom, name='chatroom'),
]