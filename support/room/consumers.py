import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from core.models import UserProfile

class RoomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id'] #obtain room url give scope for info
        self.room_group_name = f'room_{self.room_id}'
        self.user = self.scope['user']

        if not hasattr(self.channel_layer, 'presence'): #initialise here for max participants check
            self.channel_layer.presence = {}

        if not hasattr(self.channel_layer, 'room_settings'):
            self.channel_layer.room_settings = {}

        #reject unauthenticated users
        if not self.user.is_authenticated:
            await self.close()
            return


        # Check max participants before accepting
        # TODO - fix max participant check
        # room = await self.get_room()
        # current_count = len(self.channel_layer.presence.get(self.room_group_name, set()))
        # if current_count >= room.max_participants:
        #     await self.close(code=4003)  # custom close code for "room full"
        #     return

        #fetcb profile data
        self.avatar_data = await self.get_avatar_data()

        #join room group
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()

        if self.room_group_name in self.channel_layer.room_settings:
            live = self.channel_layer.room_settings[self.room_group_name]
            await self.send(text_data=json.dumps({
                'type':              'settings_update',
                'background_preset': live.get('background_preset'),
                'focus_duration':    live.get('focus_duration'),
                'break_duration':    live.get('break_duration'),
            }))

        #Add user to presence set in channel layer
        if self.room_group_name not in self.channel_layer.presence:
            self.channel_layer.presence[self.room_group_name] = {}
        self.channel_layer.presence[self.room_group_name][self.user.username] = self.avatar_data #create dict of username for avatar data

        #Broadcast updated presence list to everyone in room
        await self.broadcast_presence()

        #Announce user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.user.username} joined the room'
            }
        )

    async def disconnect(self, close_code):
        #Remove from presence
        if (hasattr(self.channel_layer, 'presence') and
                self.room_group_name in self.channel_layer.presence):
            self.channel_layer.presence[self.room_group_name].pop(self.user.username, None) #remove user from presence dict discard for sets so pop

            #Clean up empty rooms
            if not self.channel_layer.presence[self.room_group_name]:
                del self.channel_layer.presence[self.room_group_name]
                self.channel_layer.room_settings.pop(self.room_group_name, None)
            else:
                await self.broadcast_presence()

        #Announce user left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'system_message',
                'message': f'{self.user.username} left the room'
            }
        )

        await self.channel_layer.group_discard(self.room_group_name,self.channel_name)

    #join leave annoucements 
    async def system_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'message': event['message'],
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'users': event['users'],
        }))

    #helper
    async def broadcast_presence(self):
        presence = self.channel_layer.presence.get(self.room_group_name, {})
        users = [
            {'username': username, 'avatar': avatar_data}
            for username, avatar_data in presence.items()
]
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'users': users,
            }
        )

    #Chat message handlerS
    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'chat_message':
            message = data.get('message', '').strip()
            if not message:
                return
            await self.save_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': self.user.username,
                }
            )
        elif msg_type == 'settings_update':
            bg        = data.get('background_preset')
            focus     = data.get('focus_duration')
            break_dur = data.get('break_duration')

            self.channel_layer.room_settings[self.room_group_name] = {
                'background_preset': bg,
                'focus_duration':    focus,
                'break_duration':    break_dur,
            }

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type':              'settings_update',
                    'background_preset': bg,
                    'focus_duration':    focus,
                    'break_duration':    break_dur,
                }
            )

    #handlers for messages sent to the group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'username': event['username'],
        }))

    @database_sync_to_async
    def save_message(self, content):
        room = Room.objects.get(room_id=self.room_id)
        Message.objects.create(
            room=room,
            sender=self.user,
            content=content
        )
    
    @database_sync_to_async
    def get_room(self):
        return Room.objects.get(room_id=self.room_id)
    
    @database_sync_to_async
    def get_avatar_data(self):
        try:
            profile = UserProfile.objects.get(user=self.user)
            return {
                'skin': profile.skin_color,
                'hair': profile.hair,
                'outfit': profile.clothes,
            }
        except UserProfile.DoesNotExist:
            return {
                'skin': 'skin_1',
                'hair': 'hair_1',
                'outfit': 'outfit_1',
            }
        
    async def settings_update(self, event):
        await self.send(text_data=json.dumps({
            'type':              'settings_update',
            'background_preset': event.get('background_preset'),
            'focus_duration':    event.get('focus_duration'),
            'break_duration':    event.get('break_duration'),
        }))