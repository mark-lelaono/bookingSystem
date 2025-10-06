import React, { useState, useEffect } from 'react';
import '../services/emailNotifications.css';

interface EmailSettings {
  bookingConfirmations: boolean;
  meetingReminders: boolean;
  cancellationNotices: boolean;
  adminNotifications: boolean;
  bookingUpdates: boolean;
  reminderTime: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface EmailSettingsPanelProps {
  user: User | null;
  onSettingsUpdate?: (settings: EmailSettings) => void;
  onClose: () => void;
}

const EmailSettingsPanel: React.FC<EmailSettingsPanelProps> = ({ user, onSettingsUpdate, onClose }) => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    bookingConfirmations: true,
    meetingReminders: true,
    cancellationNotices: true,
    adminNotifications: user?.role === 'super_admin' || user?.role === 'room_admin',
    bookingUpdates: true,
    reminderTime: 30 // minutes before meeting
  });

  useEffect(() => {
    // Load user's email preferences from localStorage
    const savedSettings = localStorage.getItem(`email_settings_${user?.id}`);
    if (savedSettings) {
      setEmailSettings(JSON.parse(savedSettings));
    }
  }, [user]);

  const handleToggle = (settingName: keyof EmailSettings): void => {
    const newSettings = {
      ...emailSettings,
      [settingName]: !emailSettings[settingName]
    };
    
    setEmailSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem(`email_settings_${user?.id}`, JSON.stringify(newSettings));
    
    // Call parent callback
    if (onSettingsUpdate) {
      onSettingsUpdate(newSettings);
    }
  };

  const handleReminderTimeChange = (minutes: number): void => {
    const newSettings = {
      ...emailSettings,
      reminderTime: minutes
    };
    
    setEmailSettings(newSettings);
    localStorage.setItem(`email_settings_${user?.id}`, JSON.stringify(newSettings));
    
    if (onSettingsUpdate) {
      onSettingsUpdate(newSettings);
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">📧 Email Notification Settings</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="email-settings-panel">
          <div className="email-settings-title">
            📬 Notification Preferences for {user.name}
          </div>

          <div className="email-settings-option">
            <div className="email-settings-label">
              <div className="email-settings-main-text">Booking Confirmations</div>
              <div className="email-settings-sub-text">Get notified when your bookings are confirmed</div>
            </div>
            <div 
              className={`email-toggle ${emailSettings.bookingConfirmations ? 'active' : ''}`}
              onClick={() => handleToggle('bookingConfirmations')}
            >
              <div className="email-toggle-slider"></div>
            </div>
          </div>

          <div className="email-settings-option">
            <div className="email-settings-label">
              <div className="email-settings-main-text">Meeting Reminders</div>
              <div className="email-settings-sub-text">Receive reminders before your meetings start</div>
            </div>
            <div 
              className={`email-toggle ${emailSettings.meetingReminders ? 'active' : ''}`}
              onClick={() => handleToggle('meetingReminders')}
            >
              <div className="email-toggle-slider"></div>
            </div>
          </div>

          {emailSettings.meetingReminders && (
            <div className="email-settings-option">
              <div className="email-settings-label">
                <div className="email-settings-main-text">Reminder Timing</div>
                <div className="email-settings-sub-text">How early should we remind you?</div>
              </div>
              <select 
                value={emailSettings.reminderTime}
                onChange={(e) => handleReminderTimeChange(parseInt(e.target.value))}
                className="form-select"
                style={{ minWidth: '120px' }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          )}

          <div className="email-settings-option">
            <div className="email-settings-label">
              <div className="email-settings-main-text">Cancellation Notices</div>
              <div className="email-settings-sub-text">Get notified when bookings are cancelled</div>
            </div>
            <div 
              className={`email-toggle ${emailSettings.cancellationNotices ? 'active' : ''}`}
              onClick={() => handleToggle('cancellationNotices')}
            >
              <div className="email-toggle-slider"></div>
            </div>
          </div>

          <div className="email-settings-option">
            <div className="email-settings-label">
              <div className="email-settings-main-text">Booking Updates</div>
              <div className="email-settings-sub-text">Get notified when booking details change</div>
            </div>
            <div 
              className={`email-toggle ${emailSettings.bookingUpdates ? 'active' : ''}`}
              onClick={() => handleToggle('bookingUpdates')}
            >
              <div className="email-toggle-slider"></div>
            </div>
          </div>

          {(user.role === 'super_admin' || user.role === 'room_admin') && (
            <div className="email-settings-option">
              <div className="email-settings-label">
                <div className="email-settings-main-text">Admin Notifications</div>
                <div className="email-settings-sub-text">Get notified about new bookings requiring approval</div>
              </div>
              <div 
                className={`email-toggle ${emailSettings.adminNotifications ? 'active' : ''}`}
                onClick={() => handleToggle('adminNotifications')}
              >
                <div className="email-toggle-slider"></div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>📌 Note:</strong> Email notifications are sent to: <strong>{user.email}</strong>
            <br />
            <br />
            To ensure you receive all notifications, please add <strong>noreply@icpac.net</strong> to your email contacts.
          </div>

          <div className="form-buttons" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="form-button primary">
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsPanel;
