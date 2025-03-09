from django.urls import path
from .views import RegisterView, LoginView, UserView, LogoutView, OAuth42View, OAuth42CallbackView

urlpatterns = [
    path('api/register', RegisterView.as_view()),
    path('api/login', LoginView.as_view()),
    path('api/user', UserView.as_view()),
    path('api/logout', LogoutView.as_view()),
    path('api/oauth/42', OAuth42View.as_view()),
    path('api/oauth/42/callback', OAuth42CallbackView.as_view()),
]
