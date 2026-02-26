from django.urls import path
from . import views    

urlpatterns = [
    path('rooms/', views.rooms, name='rooms'),
    path('room/<uuid:room_id>/', views.chatroom_view, name='chatroom'), 
    path('community/', views.community, name='community'),
    # path('chatroom/', views.chatroom, name='chatroom'),
    path('room/create/', views.create_room, name='create_room'),
]