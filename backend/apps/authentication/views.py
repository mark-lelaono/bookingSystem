"""
Authentication views for ICPAC Booking System
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    AdminUserSerializer
)
from .models import EmailVerificationOTP
from .email_utils import send_otp_email

User = get_user_model()


@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns JWT tokens with user info
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Get the user from the validated data
        user_data = serializer.validated_data.get('user')
        if user_data:
            # Get the actual user object to check email verification
            user = User.objects.get(id=user_data['id'])
            if not user.is_email_verified:
                return Response({
                    'error': 'Please verify your email address before logging in.',
                    'requires_verification': True,
                    'email': user.email
                }, status=status.HTTP_403_FORBIDDEN)
        
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # No authentication required for registration

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate and send OTP for email verification
        try:
            otp = EmailVerificationOTP.generate_otp_for_user(user)
            email_sent = send_otp_email(
                recipient_email=user.email,
                otp_code=otp.otp_code,
                user_name=user.get_full_name()
            )
            
            if email_sent:
                return Response({
                    'message': 'Registration successful! Please check your email for the verification code.',
                    'email': user.email,
                    'requires_verification': True
                }, status=status.HTTP_201_CREATED)
            else:
                # If email fails, still allow verification later
                return Response({
                    'message': 'Registration successful! Verification email will be sent shortly.',
                    'email': user.email,
                    'requires_verification': True
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            # Log error but don't fail registration
            print(f"Error sending OTP email: {str(e)}")
            return Response({
                'message': 'Registration successful! Please contact support for email verification.',
                'email': user.email,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Get and update current user profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class PasswordChangeView(APIView):
    """
    Change user password
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Logout user by blacklisting refresh token
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token.'
            }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyEmailOTPView(APIView):
    """
    Verify email using OTP code
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        if not email or not otp_code:
            return Response({
                'error': 'Email and OTP code are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Get the latest valid OTP for this user
            otp = EmailVerificationOTP.objects.filter(
                user=user,
                is_used=False
            ).order_by('-created_at').first()
            
            if not otp:
                return Response({
                    'error': 'No valid OTP found. Please request a new verification code.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the OTP
            if otp.verify(otp_code):
                # Generate JWT tokens for the verified user
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'message': 'Email verified successfully! You are now logged in.',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired OTP code.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'User with this email does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)


@method_decorator(csrf_exempt, name='dispatch')
class ResendOTPView(APIView):
    """
    Resend OTP for email verification
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if user is already verified
            if user.is_email_verified:
                return Response({
                    'error': 'Email is already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new OTP
            otp = EmailVerificationOTP.generate_otp_for_user(user)
            email_sent = send_otp_email(
                recipient_email=user.email,
                otp_code=otp.otp_code,
                user_name=user.get_full_name()
            )
            
            if email_sent:
                return Response({
                    'message': 'Verification code sent successfully to your email.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send verification email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            return Response({
                'error': 'User with this email does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)


class UserListView(generics.ListCreateAPIView):
    """
    List and create users (admin only)
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Super admin can see all users
        if user.role == 'super_admin':
            return User.objects.all().order_by('-date_joined')
        
        # Room admin can see users who have booked their rooms
        elif user.role == 'room_admin':
            managed_room_ids = user.managed_rooms.values_list('id', flat=True)
            return User.objects.filter(
                bookings__room_id__in=managed_room_ids
            ).distinct().order_by('-date_joined')
        
        # Regular users can only see themselves
        return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        # Only super admin can create users through API
        if self.request.user.role != 'super_admin':
            raise permissions.PermissionDenied('Only super admins can create users.')
        
        user = serializer.save()
        
        # Send welcome email (optional)
        if hasattr(settings, 'EMAIL_HOST_USER') and settings.EMAIL_HOST_USER:
            try:
                send_mail(
                    subject='Welcome to ICPAC Booking System',
                    message=f"""
                    Hello {user.get_full_name()},
                    
                    Your account has been created for the ICPAC Booking System.
                    
                    Email: {user.email}
                    Role: {user.get_role_display()}
                    
                    Please contact an administrator to get your login credentials.
                    
                    Best regards,
                    ICPAC IT Team
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                pass  # Don't fail user creation if email fails


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a user (admin only)
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Super admin can manage all users
        if user.role == 'super_admin':
            return User.objects.all()
        
        # Room admin can view users who have booked their rooms
        elif user.role == 'room_admin':
            managed_room_ids = user.managed_rooms.values_list('id', flat=True)
            return User.objects.filter(
                bookings__room_id__in=managed_room_ids
            ).distinct()
        
        # Regular users can only access themselves
        return User.objects.filter(id=user.id)
    
    def perform_update(self, serializer):
        # Only super admin can update other users' roles
        if (serializer.instance != self.request.user and 
            self.request.user.role != 'super_admin'):
            raise permissions.PermissionDenied('Only super admins can modify other users.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only super admin can delete users, and can't delete themselves
        if self.request.user.role != 'super_admin':
            raise permissions.PermissionDenied('Only super admins can delete users.')
        
        if instance == self.request.user:
            raise permissions.PermissionDenied('You cannot delete your own account.')
        
        instance.delete()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard_stats(request):
    """
    Get user dashboard statistics
    """
    user = request.user
    
    # Get user's bookings count
    from apps.bookings.models import Booking
    
    total_bookings = Booking.objects.filter(user=user).count()
    pending_bookings = Booking.objects.filter(user=user, approval_status='pending').count()
    approved_bookings = Booking.objects.filter(user=user, approval_status='approved').count()
    
    stats = {
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'approved_bookings': approved_bookings,
        'user_role': user.role,
    }
    
    # Add admin stats if user is admin
    if user.role in ['super_admin', 'room_admin']:
        if user.role == 'super_admin':
            all_bookings = Booking.objects.all()
            managed_rooms_count = user.managed_rooms.count() if user.role == 'room_admin' else 0
        else:
            # Room admin stats for their managed rooms
            managed_room_ids = user.managed_rooms.values_list('id', flat=True)
            all_bookings = Booking.objects.filter(room_id__in=managed_room_ids)
            managed_rooms_count = user.managed_rooms.count()
        
        stats.update({
            'total_system_bookings': all_bookings.count(),
            'pending_approvals': all_bookings.filter(approval_status='pending').count(),
            'managed_rooms_count': managed_rooms_count,
        })
    
    return Response(stats)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """
    Request password reset - generates OTP and sends to email
    """
    email = request.data.get('email')

    if not email:
        return Response(
            {'error': 'Email address is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Don't reveal if user exists - security best practice
        return Response({
            'message': 'If an account exists with this email, a password reset code will be sent.'
        })

    # Generate OTP for password reset
    from apps.security.models import OTPToken
    from django.utils import timezone

    # Invalidate any existing password reset tokens
    OTPToken.objects.filter(
        user=user,
        token_type='password_reset',
        is_used=False
    ).update(is_used=True)

    # Create new OTP
    otp = OTPToken.create_otp(
        user=user,
        token_type='password_reset',
        expires_in_minutes=30  # 30 minute expiry
    )

    # Send email with OTP
    try:
        subject = 'Password Reset Request - ICPAC Booking System'
        message = f"""
Hello {user.get_full_name()},

You requested to reset your password for the ICPAC Booking System.

Your password reset code is: {otp.token}

This code will expire in 30 minutes.

If you did not request this reset, please ignore this email.

Best regards,
ICPAC Booking System
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        # Log the action
        from apps.security.models import AuditLog
        AuditLog.log_action(
            user=user,
            action_type='password_reset',
            description=f'Password reset requested for {user.email}',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )

    except Exception as e:
        # Log error but don't expose it
        print(f"Error sending password reset email: {e}")

    return Response({
        'message': 'If an account exists with this email, a password reset code will be sent.',
        'email': email
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_confirm(request):
    """
    Confirm password reset with OTP and set new password
    """
    email = request.data.get('email')
    otp_code = request.data.get('otp')
    new_password = request.data.get('new_password')

    if not all([email, otp_code, new_password]):
        return Response(
            {'error': 'Email, OTP code, and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid reset request'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find valid OTP token
    from apps.security.models import OTPToken

    try:
        otp = OTPToken.objects.filter(
            user=user,
            token_type='password_reset',
            is_used=False
        ).latest('created_at')
    except OTPToken.DoesNotExist:
        return Response(
            {'error': 'No valid reset request found. Please request a new password reset.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify OTP
    if not otp.verify(otp_code):
        if otp.attempts >= otp.max_attempts:
            return Response(
                {'error': 'Too many invalid attempts. Please request a new password reset.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'error': f'Invalid OTP code. {otp.max_attempts - otp.attempts} attempts remaining.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate password strength (basic validation)
    if len(new_password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    # Log the action
    from apps.security.models import AuditLog
    AuditLog.log_action(
        user=user,
        action_type='password_change',
        description=f'Password reset completed for {user.email}',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

    return Response({
        'message': 'Password reset successful. You can now login with your new password.'
    })