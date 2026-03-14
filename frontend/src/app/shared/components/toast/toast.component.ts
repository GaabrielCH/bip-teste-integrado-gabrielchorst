import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}">
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)">x</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 300px;
      max-width: 420px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 0.875rem;
      animation: slideIn 0.2s ease-out;
    }

    .toast--success { background: #22c55e; color: white; }
    .toast--error   { background: #ef4444; color: white; }
    .toast--info    { background: #3b82f6; color: white; }

    .toast__message { flex: 1; }

    .toast__close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      margin-left: 0.75rem;
      opacity: 0.8;
      padding: 0;
    }
    .toast__close:hover { opacity: 1; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(readonly toastService: ToastService) {}
}
