// signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
 constructor(private notificationService: NotificationService) {}
  public startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:44347/notificationhub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR connected.'))
      .catch((err) => console.error('❌ SignalR error:', err));

    this.hubConnection.on('ReceiveReminderNotification', (message: string) => {
      this.notificationService.addNotification(message);
      console.log('📩 New Notification:', message);
      // Trigger notification UI here (snackbar, toast, etc.)
    });
  }
}
