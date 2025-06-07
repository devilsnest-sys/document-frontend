import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private connection!: signalR.HubConnection;
  private _notifications: string[] = [];
  private _notifications$ = new BehaviorSubject<string[]>([]);
  constructor(private snackBar: MatSnackBar) {
    this.startConnection();
  }

  private startConnection() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:44347/notificationhub') // Replace with your backend URL
      .build();

    this.connection.on('ReceiveReminderNotification', (message: string) => {
      console.log('New notification:', message);
      this.snackBar.open(message, 'Close', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    });

    this.connection
      .start()
      .then(() => console.log('SignalR connected.'))
      .catch(err => console.error('SignalR connection error:', err));
  }

  get notifications$() {
    return this._notifications$.asObservable();
  }

  addNotification(message: string) {
    this._notifications.push(message);
    this._notifications$.next([...this._notifications]);
  }

  removeNotification(index: number) {
    this._notifications.splice(index, 1);
    this._notifications$.next([...this._notifications]);
  }
}
