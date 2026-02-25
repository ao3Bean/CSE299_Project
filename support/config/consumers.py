from channels.generic.websocket import AsyncWebsocketConsumer
#test consumer to see if websocket handshake works
class TestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connected!")
        await self.accept()

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected: {close_code}")

    async def receive(self, text_data):
        print(f"Message received: {text_data}")
        # Echo it straight back for testing
        await self.send(text_data=text_data)