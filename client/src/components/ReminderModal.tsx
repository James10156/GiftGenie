import { useState, useEffect } from 'react';
import { X, Calendar, Bell, Mail, MessageCircle, Smartphone, AlertCircle } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  onSave: (reminderData: ReminderFormData) => void;
  existingReminder?: GiftReminder;
}

export interface ReminderFormData {
  title: string;
  occasionType: string;
  occasionDate: string;
  advanceDays: number;
  message: string;
  notificationMethods: {
    email: {
      enabled: boolean;
      address: string;
    };
    sms: {
      enabled: boolean;
      phoneNumber: string;
    };
    push: {
      enabled: boolean;
    };
  };
  isRecurring: boolean;
}

interface GiftReminder {
  id: string;
  title: string;
  occasionType: string;
  occasionDate: string;
  advanceDays: number;
  message: string;
  notificationMethods: any;
  isRecurring: boolean;
}

const occasionTypes = [
  'birthday',
  'anniversary',
  'christmas',
  'valentine',
  'mother_day',
  'father_day',
  'graduation',
  'wedding',
  'baby_shower',
  'housewarming',
  'custom'
];

export function ReminderModal({ 
  isOpen, 
  onClose, 
  friendId, 
  friendName, 
  onSave,
  existingReminder 
}: ReminderModalProps) {
  const [formData, setFormData] = useState<ReminderFormData>({
    title: `Gift reminder for ${friendName}`,
    occasionType: 'birthday',
    occasionDate: '',
    advanceDays: 7,
    message: `Don't forget to get a gift for ${friendName}!`,
    notificationMethods: {
      email: {
        enabled: true,
        address: ''
      },
      sms: {
        enabled: false,
        phoneNumber: ''
      },
      push: {
        enabled: false
      }
    },
    isRecurring: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with existing reminder data
  useEffect(() => {
    if (existingReminder) {
      setFormData({
        title: existingReminder.title,
        occasionType: existingReminder.occasionType || 'birthday',
        occasionDate: existingReminder.occasionDate || '',
        advanceDays: existingReminder.advanceDays || 7,
        message: existingReminder.message || `Don't forget to get a gift for ${friendName}!`,
        notificationMethods: existingReminder.notificationMethods || formData.notificationMethods,
        isRecurring: existingReminder.isRecurring || false
      });
    }
  }, [existingReminder, friendName]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.occasionDate) {
      newErrors.occasionDate = 'Occasion date is required';
    } else {
      const selectedDate = new Date(formData.occasionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.occasionDate = 'Occasion date must be in the future';
      }
    }

    if (formData.advanceDays < 1 || formData.advanceDays > 365) {
      newErrors.advanceDays = 'Advance days must be between 1 and 365';
    }

    if (formData.notificationMethods.email.enabled && !formData.notificationMethods.email.address.trim()) {
      newErrors.emailAddress = 'Email address is required when email notifications are enabled';
    }

    if (formData.notificationMethods.sms.enabled && !formData.notificationMethods.sms.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required when SMS notifications are enabled';
    }

    if (!formData.notificationMethods.email.enabled && 
        !formData.notificationMethods.sms.enabled && 
        !formData.notificationMethods.push.enabled) {
      newErrors.notifications = 'At least one notification method must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const updateNotificationMethod = (method: 'email' | 'sms' | 'push', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: {
        ...prev.notificationMethods,
        [method]: {
          ...prev.notificationMethods[method],
          [field]: value
        }
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              {existingReminder ? 'Edit Gift Reminder' : 'Set Gift Reminder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Calendar size={20} />
              Reminder Details
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Gift reminder for ${friendName}`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Occasion Type and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occasion Type
                </label>
                <select
                  value={formData.occasionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, occasionType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {occasionTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occasion Date
                </label>
                <input
                  type="date"
                  value={formData.occasionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, occasionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.occasionDate && <p className="text-red-500 text-sm mt-1">{errors.occasionDate}</p>}
              </div>
            </div>

            {/* Advance Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remind me this many days before
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.advanceDays}
                onChange={(e) => setFormData(prev => ({ ...prev, advanceDays: parseInt(e.target.value) || 7 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.advanceDays && <p className="text-red-500 text-sm mt-1">{errors.advanceDays}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Don't forget to get a gift for ${friendName}!`}
              />
            </div>

            {/* Recurring */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                Repeat annually (for birthdays, anniversaries, etc.)
              </label>
            </div>
          </div>

          {/* Notification Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Bell size={20} />
              Notification Methods
            </h3>

            {errors.notifications && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-red-600 text-sm">{errors.notifications}</p>
              </div>
            )}

            {/* Email */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-600" />
                  <span className="font-medium text-gray-700">Email Notification</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationMethods.email.enabled}
                  onChange={(e) => updateNotificationMethod('email', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              {formData.notificationMethods.email.enabled && (
                <div>
                  <input
                    type="email"
                    value={formData.notificationMethods.email.address}
                    onChange={(e) => updateNotificationMethod('email', 'address', e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.emailAddress && <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>}
                </div>
              )}
            </div>

            {/* SMS */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-green-600" />
                  <span className="font-medium text-gray-700">SMS Notification</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationMethods.sms.enabled}
                  onChange={(e) => updateNotificationMethod('sms', 'enabled', e.target.checked)}
                  disabled
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded opacity-50"
                />
              </div>
              {formData.notificationMethods.sms.enabled && (
                <div>
                  <input
                    type="tel"
                    value={formData.notificationMethods.sms.phoneNumber}
                    onChange={(e) => updateNotificationMethod('sms', 'phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg opacity-50"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-purple-600" />
                  <span className="font-medium text-gray-700">Push Notification</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationMethods.push.enabled}
                  onChange={(e) => updateNotificationMethod('push', 'enabled', e.target.checked)}
                  disabled
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {existingReminder ? 'Update Reminder' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}