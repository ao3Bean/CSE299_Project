from django.urls import path
from . import views    

urlpatterns = [
    path('rooms/', views.rooms, name='rooms'),
    path('rooms/<uuid:room_id>/', views.room_detail, name='room_detail'), 
    path('community/', views.community, name='community'),
    path('chatroom/', views.chatroom, name='chatroom'),
]