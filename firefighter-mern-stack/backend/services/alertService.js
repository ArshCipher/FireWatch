/**
 * 🔥 Alert Service
 * 
 * Manages alert generation, escalation, and notification
 */

import { EventEmitter } from 'events';
import { Alert } from '../models/Alert.js';
import { Firefighter } from '../models/Firefighter.js';
import { User } from '../models/User.js';
import { logSystemEvent, logAlertEvent, logger } from '../middleware/logger.js';

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.alertQueue = [];
    this.escalationRules = this.loadEscalationRules();
    this.notificationSettings = this.loadNotificationSettings();
    this.activeAlerts = new Map();
    this.stats = {
      generated: 0,
      resolved: 0,
      escalated: 0,
      avgResolutionTime: 0
    };
  }

  /**
   * Start the alert service
   */
  start() {
    logSystemEvent('ALERT_SERVICE_STARTED', {});
    
    // Process alerts every 500ms
    this.alertInterval = setInterval(() => {
      this.processAlertQueue();
    }, 500);
    
    // Check for escalations every 30 seconds
    this.escalationInterval = setInterval(() => {
      this.checkEscalations();
    }, 30000);
    
    logger.info('Alert Service started');
  }

  /**
   * Stop the alert service
   */
  stop() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
    }
    
    logSystemEvent('ALERT_SERVICE_STOPPED', {});
    logger.info('Alert Service stopped');
  }

  /**
   * Generate new alert
   */
  async generateAlert(alertData) {
    try {
      const {
        firefighterId,
        type,
        severity,
        message,
        sensorData,
        metadata = {},
        source = 'SYSTEM'
      } = alertData;

      // Check for duplicate alerts (within last 2 minutes)
      const existingAlert = await this.checkDuplicateAlert(firefighterId, type, 2);
      if (existingAlert) {
        logger.debug('Duplicate alert suppressed', { 
          firefighterId, 
          type, 
          existingAlertId: existingAlert._id 
        });
        return existingAlert;
      }

      // Create alert
      const alert = new Alert({
        firefighterId,
        type,
        severity,
        message,
        sensorData,
        metadata: {
          ...metadata,
          source,
          generatedAt: new Date()
        },
        status: 'active',
        createdAt: new Date()
      });

      await alert.save();
      
      // Populate firefighter details
      await alert.populate('firefighterId', 'name position department');

      // Add to active alerts tracking
      this.activeAlerts.set(alert._id.toString(), {
        alert,
        createdAt: new Date(),
        escalationLevel: 0,
        notificationsSent: []
      });

      // Update statistics
      this.stats.generated++;

      // Log alert generation
      logAlertEvent(firefighterId, type, severity, { alertId: alert._id, source });

      // Add to processing queue for immediate handling
      this.alertQueue.push({
        alert,
        action: 'NEW_ALERT',
        timestamp: new Date()
      });

      // Emit alert event
      this.emit('alertGenerated', alert);

      return alert;

    } catch (error) {
      logger.error('Error generating alert', { 
        error: error.message, 
        alertData 
      });
      throw error;
    }
  }

  /**
   * Process alert queue
   */
  async processAlertQueue() {
    if (this.alertQueue.length === 0) return;

    const item = this.alertQueue.shift();
    
    try {
      switch (item.action) {
        case 'NEW_ALERT':
          await this.processNewAlert(item.alert);
          break;
        case 'ESCALATE':
          await this.escalateAlert(item.alert);
          break;
        case 'RESOLVE':
          await this.resolveAlert(item.alert, item.resolution);
          break;
      }
    } catch (error) {
      logger.error('Error processing alert queue item', { 
        error: error.message, 
        alertId: item.alert._id,
        action: item.action 
      });
    }
  }

  /**
   * Process new alert
   */
  async processNewAlert(alert) {
    // Determine notification recipients
    const recipients = await this.getNotificationRecipients(alert);
    
    // Send immediate notifications for critical alerts
    if (alert.severity === 'CRITICAL') {
      await this.sendImmediateNotifications(alert, recipients);
    } else {
      await this.sendStandardNotifications(alert, recipients);
    }

    // Set escalation timer if needed
    this.scheduleEscalation(alert);

    logger.info('New alert processed', { 
      alertId: alert._id, 
      severity: alert.severity,
      type: alert.type,
      firefighterId: alert.firefighterId._id
    });
  }

  /**
   * Check for duplicate alerts
   */
  async checkDuplicateAlert(firefighterId, type, minutesWindow) {
    const timeThreshold = new Date(Date.now() - minutesWindow * 60 * 1000);
    
    return await Alert.findOne({
      firefighterId,
      type,
      status: 'active',
      createdAt: { $gte: timeThreshold }
    });
  }

  /**
   * Get notification recipients based on alert severity and department
   */
  async getNotificationRecipients(alert) {
    const firefighter = await Firefighter.findById(alert.firefighterId);
    if (!firefighter) return [];

    const recipients = [];
    
    // Always notify commanders and admins
    const commanders = await User.find({
      role: { $in: ['commander', 'admin'] },
      department: firefighter.department,
      isActive: true
    });
    
    recipients.push(...commanders);

    // For critical alerts, notify all admins regardless of department
    if (alert.severity === 'CRITICAL') {
      const allAdmins = await User.find({
        role: 'admin',
        isActive: true
      });
      recipients.push(...allAdmins);
    }

    // For medical-related alerts, notify medics
    if (alert.type.includes('HEART_RATE') || alert.type.includes('MEDICAL')) {
      const medics = await User.find({
        role: 'medic',
        department: firefighter.department,
        isActive: true
      });
      recipients.push(...medics);
    }

    // Remove duplicates
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r._id.toString() === recipient._id.toString())
    );

    return uniqueRecipients;
  }

  /**
   * Send immediate notifications for critical alerts
   */
  async sendImmediateNotifications(alert, recipients) {
    const notifications = [];
    
    for (const recipient of recipients) {
      // Email notification
      if (recipient.preferences?.notifications?.email !== false) {
        notifications.push(this.sendEmailNotification(recipient, alert));
      }
      
      // SMS notification for critical alerts
      if (recipient.preferences?.notifications?.sms === true) {
        notifications.push(this.sendSMSNotification(recipient, alert));
      }
      
      // Push notification
      if (recipient.preferences?.notifications?.push !== false) {
        notifications.push(this.sendPushNotification(recipient, alert));
      }
    }

    // Wait for all notifications to be sent
    await Promise.allSettled(notifications);
    
    // Track notifications sent
    const alertTracking = this.activeAlerts.get(alert._id.toString());
    if (alertTracking) {
      alertTracking.notificationsSent.push({
        type: 'IMMEDIATE',
        recipients: recipients.map(r => r._id),
        sentAt: new Date()
      });
    }
  }

  /**
   * Send standard notifications
   */
  async sendStandardNotifications(alert, recipients) {
    const notifications = [];
    
    for (const recipient of recipients) {
      // Push notification (default for all alerts)
      notifications.push(this.sendPushNotification(recipient, alert));
      
      // Email for high severity alerts
      if (alert.severity === 'HIGH' && recipient.preferences?.notifications?.email !== false) {
        notifications.push(this.sendEmailNotification(recipient, alert));
      }
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Schedule alert escalation
   */
  scheduleEscalation(alert) {
    const escalationTime = this.getEscalationTime(alert.severity);
    
    setTimeout(() => {
      this.alertQueue.push({
        alert,
        action: 'ESCALATE',
        timestamp: new Date()
      });
    }, escalationTime);
  }

  /**
   * Get escalation time based on severity
   */
  getEscalationTime(severity) {
    const escalationTimes = {
      'CRITICAL': 2 * 60 * 1000,  // 2 minutes
      'HIGH': 5 * 60 * 1000,      // 5 minutes
      'MEDIUM': 15 * 60 * 1000,   // 15 minutes
      'LOW': 30 * 60 * 1000       // 30 minutes
    };
    
    return escalationTimes[severity] || escalationTimes.MEDIUM;
  }

  /**
   * Check for alerts that need escalation
   */
  async checkEscalations() {
    const now = new Date();
    
    for (const [alertId, alertTracking] of this.activeAlerts) {
      const { alert, createdAt, escalationLevel } = alertTracking;
      
      // Check if alert should be escalated
      const escalationTime = this.getEscalationTime(alert.severity);
      const timeSinceCreation = now - createdAt;
      
      if (timeSinceCreation > escalationTime && escalationLevel === 0) {
        await this.escalateAlert(alert);
      }
    }
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alert) {
    try {
      const alertTracking = this.activeAlerts.get(alert._id.toString());
      if (!alertTracking || alertTracking.escalationLevel > 0) {
        return; // Already escalated or not found
      }

      // Update escalation level
      alertTracking.escalationLevel = 1;
      this.stats.escalated++;

      // Get higher-level recipients
      const escalationRecipients = await this.getEscalationRecipients(alert);
      
      // Send escalation notifications
      await this.sendEscalationNotifications(alert, escalationRecipients);

      // Log escalation
      logSystemEvent('ALERT_ESCALATED', {
        alertId: alert._id,
        firefighterId: alert.firefighterId,
        severity: alert.severity,
        escalationLevel: 1
      });

      // Emit escalation event
      this.emit('alertEscalated', alert);

      logger.warn('Alert escalated', { 
        alertId: alert._id, 
        severity: alert.severity,
        escalationLevel: 1
      });

    } catch (error) {
      logger.error('Error escalating alert', { 
        error: error.message, 
        alertId: alert._id 
      });
    }
  }

  /**
   * Get escalation recipients (higher authority)
   */
  async getEscalationRecipients(alert) {
    // Get all admins and senior commanders
    return await User.find({
      role: { $in: ['admin'] },
      isActive: true
    });
  }

  /**
   * Send escalation notifications
   */
  async sendEscalationNotifications(alert, recipients) {
    const notifications = [];
    
    for (const recipient of recipients) {
      // Always send email for escalated alerts
      notifications.push(this.sendEmailNotification(recipient, alert, true));
      
      // Always send push notification
      notifications.push(this.sendPushNotification(recipient, alert, true));
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
    try {
      const alert = await Alert.findById(alertId);
      if (!alert || alert.status !== 'active') {
        throw new Error('Alert not found or not active');
      }

      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
      if (notes) alert.notes = notes;

      await alert.save();

      // Remove from active tracking
      this.activeAlerts.delete(alertId);

      // Log acknowledgment
      logSystemEvent('ALERT_ACKNOWLEDGED', {
        alertId,
        acknowledgedBy,
        notes: notes ? 'Yes' : 'No'
      });

      // Emit acknowledgment event
      this.emit('alertAcknowledged', alert);

      return alert;

    } catch (error) {
      logger.error('Error acknowledging alert', { 
        error: error.message, 
        alertId 
      });
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolvedBy, resolution = '') {
    try {
      const alert = await Alert.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      const resolutionTime = new Date();
      alert.status = 'resolved';
      alert.resolvedAt = resolutionTime;
      alert.resolvedBy = resolvedBy;
      alert.resolution = resolution;

      await alert.save();

      // Update statistics
      this.stats.resolved++;
      this.updateAvgResolutionTime(alert.createdAt, resolutionTime);

      // Remove from active tracking
      this.activeAlerts.delete(alertId);

      // Log resolution
      logSystemEvent('ALERT_RESOLVED', {
        alertId,
        resolvedBy,
        resolutionTime: resolutionTime - alert.createdAt
      });

      // Emit resolution event
      this.emit('alertResolved', alert);

      return alert;

    } catch (error) {
      logger.error('Error resolving alert', { 
        error: error.message, 
        alertId 
      });
      throw error;
    }
  }

  /**
   * Send email notification (placeholder)
   */
  async sendEmailNotification(recipient, alert, isEscalation = false) {
    // Email sending logic would go here
    // For now, just log the action
    logger.info('Email notification sent', {
      recipient: recipient.email,
      alertId: alert._id,
      severity: alert.severity,
      isEscalation
    });
  }

  /**
   * Send SMS notification (placeholder)
   */
  async sendSMSNotification(recipient, alert) {
    // SMS sending logic would go here
    logger.info('SMS notification sent', {
      recipient: recipient.phone || 'No phone',
      alertId: alert._id,
      severity: alert.severity
    });
  }

  /**
   * Send push notification (placeholder)
   */
  async sendPushNotification(recipient, alert, isEscalation = false) {
    // Push notification logic would go here
    logger.info('Push notification sent', {
      recipient: recipient._id,
      alertId: alert._id,
      severity: alert.severity,
      isEscalation
    });
  }

  /**
   * Update average resolution time
   */
  updateAvgResolutionTime(createdAt, resolvedAt) {
    const resolutionTime = resolvedAt - createdAt;
    const weight = 0.1;
    this.stats.avgResolutionTime = 
      (this.stats.avgResolutionTime * (1 - weight)) + (resolutionTime * weight);
  }

  /**
   * Load escalation rules (placeholder)
   */
  loadEscalationRules() {
    return {
      CRITICAL: {
        escalationTime: 2 * 60 * 1000, // 2 minutes
        maxEscalationLevel: 3
      },
      HIGH: {
        escalationTime: 5 * 60 * 1000, // 5 minutes
        maxEscalationLevel: 2
      },
      MEDIUM: {
        escalationTime: 15 * 60 * 1000, // 15 minutes
        maxEscalationLevel: 1
      },
      LOW: {
        escalationTime: 30 * 60 * 1000, // 30 minutes
        maxEscalationLevel: 1
      }
    };
  }

  /**
   * Load notification settings (placeholder)
   */
  loadNotificationSettings() {
    return {
      channels: ['push', 'email', 'sms'],
      retryAttempts: 3,
      retryDelay: 30000 // 30 seconds
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeAlerts: this.activeAlerts.size,
      queueLength: this.alertQueue.length
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values()).map(tracking => tracking.alert);
  }
}

// Create singleton instance
const alertService = new AlertService();

// Export start function as expected by server.js
export const startAlertService = (io) => {
  alertService.io = io; // Store io reference for real-time updates
  alertService.start();
  return alertService;
};

export default alertService;
