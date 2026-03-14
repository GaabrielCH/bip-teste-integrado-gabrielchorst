import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private idCounter = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  private show(type: ToastMessage['type'], message: string): void {
    const toast: ToastMessage = { id: ++this.idCounter, type, message };
    this.toasts.update(current => [...current, toast]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }
}
