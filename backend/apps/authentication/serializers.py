"""
Authentication serializers for ICPAC Booking System
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user information
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['user_id'] = user.id
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        
        return token

    def validate(self, attrs):
        # Use email instead of username
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,  # Django uses username field, but we want email
                password=password
            )
            
            if not user:
                # Try to get user by email and check if user exists
                try:
                    user_obj = User.objects.get(email=email)
                    if not user_obj.check_password(password):
                        raise serializers.ValidationError('Invalid email or password.')
                except User.DoesNotExist:
                    raise serializers.ValidationError('Invalid email or password.')
                    
                user = user_obj
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            # Get the token
            refresh = self.get_token(user)
            
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }
        else:
            raise serializers.ValidationError('Must include email and password.')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Password must be at least 8 characters long'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Confirm your password'
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'phone_number', 'department'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        # Check password confirmation
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        
        return attrs

    def validate_email(self, value):
        """Check if email is already in use and domain is allowed"""
        email = value.lower()
        
        # Check allowed domains
        allowed_domains = ['@icpac.net', '@igad.int']
        if not any(email.endswith(domain) for domain in allowed_domains):
            raise serializers.ValidationError(
                'Email must be from an allowed domain (@icpac.net or @igad.int).'
            )
        
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def create(self, validated_data):
        """Create new user with email as username"""
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        
        # Use email as username for Django auth - pass username as first positional arg
        user = User.objects.create_user(
            email,      # username (first positional argument)
            email,      # email (second positional argument) 
            password,   # password (third positional argument)
            **validated_data  # remaining fields
        )
        return user

    def validate_username(self, value):
        """Check if username is already in use"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value



class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user information
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    managed_rooms_data = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'department', 'is_active', 'date_joined',
            'managed_rooms', 'managed_rooms_data'
        ]
        read_only_fields = ['id', 'date_joined', 'managed_rooms_data']

    def get_managed_rooms_data(self, obj):
        """Get detailed info about managed rooms for room admins"""
        if obj.role == 'room_admin':
            from apps.rooms.serializers import RoomSerializer
            return RoomSerializer(obj.managed_rooms.all(), many=True).data
        return []


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information
    """
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'department'
        ]

    def update(self, instance, validated_data):
        # Only allow users to update their own basic info
        # Role changes should be done by admins through admin interface
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change
    """
    old_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        user = self.context['request'].user
        
        # Check old password
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({
                'old_password': 'Current password is incorrect.'
            })
        
        # Check password confirmation
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Password confirmation does not match.'
            })
        
        # Validate new password strength
        try:
            validate_password(attrs['new_password'], user)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': e.messages})
        
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for admin user management (super admin only)
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'department', 'is_active', 'is_staff',
            'date_joined', 'last_login', 'managed_rooms'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def validate_role(self, value):
        """Validate role assignment"""
        request_user = self.context['request'].user
        
        # Only super admin can create other super admins
        if value == 'super_admin' and not request_user.role == 'super_admin':
            raise serializers.ValidationError(
                'Only super admins can assign super admin role.'
            )
        
        return value