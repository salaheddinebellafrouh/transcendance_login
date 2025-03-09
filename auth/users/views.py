from rest_framework.views import APIView 
from .serializers import UserSerializer
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from .models import User
import jwt,  datetime
import requests
from django.conf import settings



class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    

class LoginView(APIView):
    def post(self, request):
        try:
            email = request.data['email']
            password = request.data['password']
            
            user = User.objects.filter(email=email).first()
            
            if not user:
                raise AuthenticationFailed('User not found!')
            
            if not user.check_password(password):
                raise AuthenticationFailed('Incorrect password!')
            
            payload = {
                'id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
                'iat': datetime.datetime.utcnow()
            }
            
            token = jwt.encode(payload, 'secret', algorithm='HS256')
            
            response = Response()
            response.set_cookie(key='jwt', value=token, httponly=True)
            response.data = {
                'jwt': token,
                'message': 'Login successful'
            }
            return response
            
        except KeyError:
            raise AuthenticationFailed('Email and password are required!')
        except Exception as e:
            raise AuthenticationFailed(str(e))

class UserView(APIView):
    def get(self, request):
        auth_header = request.headers.get('Authorization')
        token = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            token = request.COOKIES.get('jwt')
        
        if not token:
            print("No token found in cookies or headers")
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            print(f"Token decoded, payload: {payload}")
            
            user = User.objects.filter(id=payload['id']).first()
            if not user:
                raise AuthenticationFailed('User not found!')
                
            serializer = UserSerializer(user)
            return Response(serializer.data)
            
        except jwt.ExpiredSignatureError:
            print("Token expired")
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            print("Invalid token")
            raise AuthenticationFailed('Invalid token!')
        except Exception as e:
            print(f"Other error: {str(e)}")
            raise AuthenticationFailed('Authentication failed!')
    
class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message' : 'success Logout'
        }
        return response

class OAuth42View(APIView):
    def get(self, request):
        auth_url = f"{settings.OAUTH42_AUTHORIZATION_URL}?client_id={settings.OAUTH42_CLIENT_ID}&redirect_uri={settings.OAUTH42_REDIRECT_URI}&response_type=code"
        return Response({"auth_url": auth_url})

class OAuth42CallbackView(APIView):
    def post(self, request):
        code = request.data.get('code')
        
        try:
            # Exchange code for access token
            token_response = requests.post(settings.OAUTH42_TOKEN_URL, data={
                'grant_type': 'authorization_code',
                'client_id': settings.OAUTH42_CLIENT_ID,
                'client_secret': settings.OAUTH42_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.OAUTH42_REDIRECT_URI
            })
            
            if token_response.status_code != 200:
                raise AuthenticationFailed('Failed to authenticate with 42')
                
            access_token = token_response.json().get('access_token')
            
            # Get user info from 42 API
            user_response = requests.get('https://api.intra.42.fr/v2/me', 
                headers={'Authorization': f'Bearer {access_token}'})
                
            if user_response.status_code != 200:
                raise AuthenticationFailed('Failed to get user info from 42')
                
            user_data = user_response.json()
            
            # Create or get user
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'name': user_data['displayname'],
                    'password': User.objects.make_random_password(),
                    'image_url': user_data.get('image', {}).get('link')  # Add image URL
                }
            )
            
            # Update image URL if user already exists
            if not created and user_data.get('image', {}).get('link'):
                user.image_url = user_data['image']['link']
                user.save()
            
            # Generate JWT token
            payload = {
                'id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
                'iat': datetime.datetime.utcnow()
            }
            
            token = jwt.encode(payload, 'secret', algorithm='HS256')
            
            response = Response()
            response.set_cookie(key='jwt', value=token, httponly=True)
            response.data = {
                'jwt': token,
                'image_url': user_data.get('image', {}).get('link')  # Return image URL
            }
            return response
            
        except Exception as e:
            print("OAuth callback error:", str(e))
            raise AuthenticationFailed('Authentication failed')