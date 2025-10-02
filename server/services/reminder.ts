import { storageAdapter } from '../storage-adapter';
import { emailService } from './email';

export class ReminderService {
  async checkDueReminders(): Promise<void> {
    try {
      console.log('🔔 Checking for due reminders...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get all active reminders that are due today or overdue
      const dueReminders = await storageAdapter.getDueReminders(todayISO);
      
      if (dueReminders.length === 0) {
        console.log('📅 No reminders due today');
        return;
      }

      console.log(`📋 Found ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }

    } catch (error) {
      console.error('❌ Error checking due reminders:', error);
    }
  }

  private async processReminder(reminder: any): Promise<void> {
    try {
      console.log(`📨 Processing reminder: ${reminder.title}`);

      // Check if reminder was already sent today
      const lastSent = reminder.lastSentAt ? new Date(reminder.lastSentAt) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (lastSent && lastSent >= today) {
        console.log(`⏭️  Reminder already sent today: ${reminder.title}`);
        return;
      }

      let sent = false;

      // Send email notification if enabled
      if (reminder.notificationMethods?.email?.enabled) {
        const emailAddress = reminder.notificationMethods.email.address;
        if (emailAddress) {
          const success = await emailService.sendGiftReminder(
            emailAddress,
            reminder.friendName || 'Your friend',
            reminder.occasionType || 'special occasion',
            reminder.occasionDate || '',
            reminder.message
          );
          
          if (success) {
            console.log(`✅ Email reminder sent to: ${emailAddress}`);
            sent = true;
          }
        }
      }

      // TODO: Add SMS notification when implemented in Phase 2
      // TODO: Add push notification when implemented in Phase 3

      if (sent) {
        // Update the reminder as sent
        await storageAdapter.updateGiftReminder(reminder.id, {
          lastSentAt: new Date().toISOString(),
          status: reminder.isRecurring ? 'active' : 'sent'
        });

        // If it's a recurring reminder, schedule next year
        if (reminder.isRecurring) {
          await this.scheduleNextYearReminder(reminder);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing reminder ${reminder.title}:`, error);
    }
  }

  private async scheduleNextYearReminder(reminder: any): Promise<void> {
    if (!reminder.isRecurring) return;

    try {
      // Calculate next year's dates
      const nextOccasionDate = new Date(reminder.occasionDate);
      nextOccasionDate.setFullYear(nextOccasionDate.getFullYear() + 1);

      const nextReminderDate = new Date(nextOccasionDate);
      nextReminderDate.setDate(nextReminderDate.getDate() - (reminder.advanceDays || 7));

      // Update the reminder for next year
      await storageAdapter.updateGiftReminder(reminder.id, {
        occasionDate: nextOccasionDate.toISOString(),
        reminderDate: nextReminderDate.toISOString(),
        status: 'active',
        lastSentAt: null
      });

      console.log(`🔄 Scheduled recurring reminder for next year: ${reminder.title}`);
    } catch (error) {
      console.error(`❌ Error scheduling next year reminder:`, error);
    }
  }

  // Manual method to test reminder sending
  async testReminder(reminderId: string): Promise<boolean> {
    try {
      const reminder = await storageAdapter.getGiftReminder(reminderId);
      if (!reminder) {
        console.log('❌ Reminder not found');
        return false;
      }

      await this.processReminder(reminder);
      return true;
    } catch (error) {
      console.error('❌ Error testing reminder:', error);
      return false;
    }
  }
}

export const reminderService = new ReminderService();