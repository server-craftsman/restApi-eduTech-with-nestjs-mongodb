/**
 * NotificationChannel — defines which channels a notification is sent through.
 * Maps to Novu channels + internal in-app storage.
 */
export enum NotificationChannel {
  /** In-app notification (stored in DB, shown in bell icon) */
  InApp = 'in_app',
  /** Email notification via SMTP/Novu */
  Email = 'email',
  /** Push notification via FCM/APNS (future) */
  Push = 'push',
}
