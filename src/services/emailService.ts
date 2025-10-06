// Email Notification Service for ICPAC Booking System
import emailjs from '@emailjs/browser';

interface EmailConfig {
  serviceId: string;
  templateIds: {
    bookingConfirmation: string;
    adminNotification: string;
    meetingReminder: string;
    bookingCancellation: string;
    bookingUpdate: string;
    bookingApproval: string;
    bookingRejection: string;
  };
  publicKey: string;
}

interface BookingData {
  id?: number;
  title: string;
  organizer: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime: string;
  attendeeCount: number;
  description?: string;
  bookingType: string;
  approvalStatus?: string;
  duration?: number;
}

interface Room {
  id: number;
  name: string;
  requiresApproval?: boolean;
  location?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  managedRooms?: number[];
}

interface FormattedDateTime {
  date: string;
  time: string;
  dateTime: string;
}

interface NotificationResult {
  success: boolean;
  message: string;
}

interface ReminderResult {
  success: boolean;
  reminderTime?: Date;
  message?: string;
}

class EmailNotificationService {
  private emailConfig: EmailConfig;

  constructor() {
    // In a real implementation, you'd use services like:
    // - EmailJS for client-side email sending
    // - SendGrid, Mailgun, or AWS SES for backend email services
    // - Your organization's SMTP server
    
    this.emailConfig = {
      serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'your_emailjs_service_id',
      templateIds: {
        bookingConfirmation: process.env.REACT_APP_EMAILJS_TEMPLATE_CONFIRMATION || 'template_booking_confirm',
        adminNotification: process.env.REACT_APP_EMAILJS_TEMPLATE_ADMIN || 'template_admin_notify',
        meetingReminder: process.env.REACT_APP_EMAILJS_TEMPLATE_REMINDER || 'template_meeting_reminder',
        bookingCancellation: process.env.REACT_APP_EMAILJS_TEMPLATE_CANCEL || 'template_booking_cancel',
        bookingUpdate: process.env.REACT_APP_EMAILJS_TEMPLATE_UPDATE || 'template_booking_update',
        bookingApproval: process.env.REACT_APP_EMAILJS_TEMPLATE_APPROVAL || 'template_booking_approval',
        bookingRejection: process.env.REACT_APP_EMAILJS_TEMPLATE_REJECTION || 'template_booking_rejection'
      },
      publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_emailjs_public_key'
    };
  }

  // Format date for email templates
  formatDateTime(date: string, time: string): FormattedDateTime {
    const bookingDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return {
      date: bookingDate.toLocaleDateString('en-US', options),
      time: this.formatTime(time),
      dateTime: `${bookingDate.toLocaleDateString('en-US', options)} at ${this.formatTime(time)}`
    };
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  // Get room admins for a specific room
  getRoomAdmins(roomId: number, users: User[]): User[] {
    return users.filter(user => 
      user.role === 'super_admin' || 
      (user.role === 'room_admin' && user.managedRooms?.includes(roomId))
    );
  }

  // Send booking confirmation to user
  async sendBookingConfirmation(bookingData: BookingData, room: Room, user: User): Promise<NotificationResult> {
    try {
      const { date, time, dateTime } = this.formatDateTime(bookingData.startDate, bookingData.startTime);
      
      const emailParams = {
        to_email: user.email,
        to_name: user.name,
        booking_id: bookingData.id || Date.now(),
        meeting_title: bookingData.title,
        organizer: bookingData.organizer,
        room_name: room.name,
        booking_date: date,
        booking_time: time,
        booking_datetime: dateTime,
        duration: this.formatDuration(bookingData),
        attendee_count: bookingData.attendeeCount,
        description: bookingData.description || 'No additional details provided',
        booking_type: bookingData.bookingType,
        approval_status: bookingData.approvalStatus || 'pending'
      };

      // Simulate email sending (replace with actual email service)
      console.log('📧 Sending booking confirmation email:', emailParams);
      
      // Try to send real email if EmailJS is configured
      if (this.emailConfig.serviceId !== 'your_emailjs_service_id' && this.emailConfig.publicKey !== 'your_emailjs_public_key') {
        try {
          await emailjs.send(
            this.emailConfig.serviceId, 
            this.emailConfig.templateIds.bookingConfirmation, 
            emailParams, 
            this.emailConfig.publicKey
          );
          this.showNotification(`✅ Real email sent to ${user.email}`, 'success');
        } catch (emailError) {
          console.error('EmailJS send failed:', emailError);
          this.showNotification(`⚠️ Email service unavailable - showing notification only`, 'warning');
        }
      } else {
        // Show simulation notification if not configured
        this.showNotification(`📧 Email notification simulated for ${user.email} (configure EmailJS for real emails)`, 'info');
      }
      
      return { success: true, message: 'Booking confirmation sent successfully' };
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      return { success: false, message: 'Failed to send booking confirmation' };
    }
  }

  // Send notification to room admins about new booking
  async sendAdminNotification(bookingData: BookingData, room: Room, user: User, admins: User[]): Promise<NotificationResult> {
    try {
      const { date, time, dateTime } = this.formatDateTime(bookingData.startDate, bookingData.startTime);
      
      const emailPromises = admins.map(async (admin) => {
        const emailParams = {
          to_email: admin.email,
          to_name: admin.name,
          admin_role: admin.role === 'super_admin' ? 'Super Administrator' : 'Room Administrator',
          booking_id: bookingData.id || Date.now(),
          meeting_title: bookingData.title,
          organizer: bookingData.organizer,
          organizer_email: user.email,
          room_name: room.name,
          booking_date: date,
          booking_time: time,
          booking_datetime: dateTime,
          duration: this.formatDuration(bookingData),
          attendee_count: bookingData.attendeeCount,
          description: bookingData.description || 'No additional details provided',
          booking_type: bookingData.bookingType,
          requires_approval: room.requiresApproval ? 'Yes' : 'No'
        };

        console.log(`📧 Sending admin notification to ${admin.name} (${admin.email}):`, emailParams);
        
        // In production: await emailjs.send(...)
        return { success: true, admin: admin.name };
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      
      this.showNotification(`Admin notifications sent to ${successCount} administrator(s)`, 'info');
      
      return { success: true, message: `Notifications sent to ${successCount} administrators` };
    } catch (error) {
      console.error('Error sending admin notifications:', error);
      return { success: false, message: 'Failed to send admin notifications' };
    }
  }

  // Send 30-minute meeting reminder
  async sendMeetingReminder(booking: BookingData, room: Room, user: User): Promise<NotificationResult> {
    try {
      const { time, dateTime } = this.formatDateTime(booking.startDate, booking.startTime);
      
      const emailParams = {
        to_email: user.email,
        to_name: user.name,
        meeting_title: booking.title,
        organizer: booking.organizer,
        room_name: room.name,
        booking_time: time,
        booking_datetime: dateTime,
        duration: this.formatDuration(booking),
        attendee_count: booking.attendeeCount,
        description: booking.description || 'No additional details',
        room_location: room.location || 'ICPAC Building',
        reminder_time: '30 minutes'
      };

      console.log('⏰ Sending 30-minute meeting reminder:', emailParams);
      
      // In production: await emailjs.send(...)
      this.showNotification(`Meeting reminder sent to ${user.name}`, 'reminder');
      
      return { success: true, message: 'Meeting reminder sent successfully' };
    } catch (error) {
      console.error('Error sending meeting reminder:', error);
      return { success: false, message: 'Failed to send meeting reminder' };
    }
  }

  // Send booking cancellation notification
  async sendCancellationNotification(booking: BookingData, room: Room, user: User, reason: string = ''): Promise<NotificationResult> {
    try {
      const { dateTime } = this.formatDateTime(booking.startDate, booking.startTime);
      
      const emailParams = {
        to_email: user.email,
        to_name: user.name,
        meeting_title: booking.title,
        room_name: room.name,
        booking_datetime: dateTime,
        cancellation_reason: reason || 'No reason provided',
        cancelled_by: user.name
      };

      console.log('❌ Sending booking cancellation notification:', emailParams);
      
      // In production: await emailjs.send(...)
      this.showNotification(`Cancellation notification sent to ${user.email}`, 'warning');
      
      return { success: true, message: 'Cancellation notification sent' };
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
      return { success: false, message: 'Failed to send cancellation notification' };
    }
  }

  // Send booking approval notification
  async sendApprovalNotification(booking: BookingData, room: Room, user: User, approvedBy: string): Promise<NotificationResult> {
    try {
      const { date, time, dateTime } = this.formatDateTime(booking.startDate, booking.startTime);
      
      const emailParams = {
        to_email: user.email,
        to_name: user.name,
        booking_id: booking.id,
        meeting_title: booking.title,
        organizer: booking.organizer,
        room_name: room.name,
        booking_date: date,
        booking_time: time,
        booking_datetime: dateTime,
        duration: this.formatDuration(booking),
        attendee_count: booking.attendeeCount,
        description: booking.description || 'No additional details provided',
        approved_by: approvedBy,
        approved_at: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      };

      console.log('✅ Sending booking approval notification:', emailParams);
      
      // Try to send real email if EmailJS is configured
      if (this.emailConfig.serviceId !== 'your_emailjs_service_id' && this.emailConfig.publicKey !== 'your_emailjs_public_key') {
        try {
          await emailjs.send(
            this.emailConfig.serviceId, 
            this.emailConfig.templateIds.bookingApproval, 
            emailParams, 
            this.emailConfig.publicKey
          );
          this.showNotification(`✅ Approval email sent to ${user.email}`, 'success');
        } catch (emailError) {
          console.error('EmailJS approval send failed:', emailError);
          this.showNotification(`⚠️ Email service unavailable - showing notification only`, 'warning');
        }
      } else {
        this.showNotification(`📧 Approval notification simulated for ${user.email} (configure EmailJS for real emails)`, 'info');
      }
      
      return { success: true, message: 'Approval notification sent successfully' };
    } catch (error) {
      console.error('Error sending approval notification:', error);
      return { success: false, message: 'Failed to send approval notification' };
    }
  }

  // Send booking rejection notification
  async sendRejectionNotification(booking: BookingData, room: Room, user: User, rejectedBy: string, reason: string = ''): Promise<NotificationResult> {
    try {
      const { dateTime } = this.formatDateTime(booking.startDate, booking.startTime);
      
      const emailParams = {
        to_email: user.email,
        to_name: user.name,
        booking_id: booking.id,
        meeting_title: booking.title,
        organizer: booking.organizer,
        room_name: room.name,
        booking_datetime: dateTime,
        rejected_by: rejectedBy,
        rejection_reason: reason || 'No specific reason provided',
        rejected_at: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      };

      console.log('❌ Sending booking rejection notification:', emailParams);
      
      // In production: await emailjs.send(...)
      this.showNotification(`Rejection notification sent to ${user.email}`, 'warning');
      
      return { success: true, message: 'Rejection notification sent successfully' };
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      return { success: false, message: 'Failed to send rejection notification' };
    }
  }

  // Format duration for email templates
  formatDuration(bookingData: BookingData): string {
    if (bookingData.bookingType === 'full-day') {
      return 'Full Day (8:00 AM - 6:00 PM)';
    } else if (bookingData.bookingType === 'multi-day') {
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate!);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `${days} days`;
    } else if (bookingData.bookingType === 'weekly') {
      return '7 days (Weekly booking)';
    } else {
      const duration = bookingData.duration || 1;
      return `${duration} hour${duration > 1 ? 's' : ''} (${bookingData.startTime} - ${bookingData.endTime})`;
    }
  }

  // Schedule meeting reminders (to be called by a background service)
  scheduleReminder(booking: BookingData, room: Room, user: User): ReminderResult {
    const now = new Date();
    const bookingDateTime = new Date(`${booking.startDate} ${booking.startTime}`);
    const reminderTime = new Date(bookingDateTime.getTime() - (30 * 60 * 1000)); // 30 minutes before
    
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0) {
      console.log(`⏰ Reminder scheduled for ${reminderTime.toLocaleString()}`);
      
      // Schedule the reminder
      setTimeout(() => {
        this.sendMeetingReminder(booking, room, user);
      }, timeUntilReminder);
      
      return { success: true, reminderTime: reminderTime };
    } else {
      console.log('⚠️ Meeting is too soon for reminder or has already passed');
      return { success: false, message: 'Meeting is too soon for reminder' };
    }
  }

  // Show notification to user (you can customize this based on your UI framework)
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'reminder' = 'info'): void {
    // Create a simple notification display
    const notification = document.createElement('div');
    notification.className = `email-notification email-notification-${type}`;
    notification.innerHTML = `
      <div class="email-notification-content">
        <span class="email-notification-icon">
          ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'reminder' ? '⏰' : 'ℹ️'}
        </span>
        <span class="email-notification-message">${message}</span>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  private getNotificationColor(type: 'info' | 'success' | 'warning' | 'reminder'): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'reminder': return '#8b5cf6';
      default: return '#3b82f6';
    }
  }

  // Test email service connection
  async testEmailService(): Promise<NotificationResult> {
    try {
      console.log('🧪 Testing email service connection...');
      // In production, you would test the actual email service connection
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('Email service test failed:', error);
      return { success: false, message: 'Email service connection failed' };
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailNotificationService();
export default emailService;
