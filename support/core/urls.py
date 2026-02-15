#represent the different urls that go to the different views in the core app
#similar to php header but more organized and easier to maintain
from django.urls import URLPattern, path
from . import views

#list for all the urls that the user can navigate from core app 
urlpatterns = [  
    path('', views.index, name='index'), #when the url is empty, go to the index view
    #path('url_name/', views.view_function_name, name='url_name')
    #so from '' it goes to index than we can redirect to v1/
]