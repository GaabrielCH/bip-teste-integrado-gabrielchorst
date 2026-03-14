import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="overlay" (click)="onCancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3 class="dialog__title">{{ title }}</h3>
          <p class="dialog__message">{{ message }}</p>
          <div class="dialog__actions">
            <button class="btn btn--secondary" (click)="onCancel()">Cancelar</button>
            <button class="btn btn--danger" (click)="onConfirm()">Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 500;
    }

    .dialog {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }

    .dialog__title {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111;
    }

    .dialog__message {
      margin: 0 0 1.5rem;
      color: #555;
      font-size: 0.9375rem;
    }

    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 5px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn:hover { opacity: 0.85; }
    .btn--secondary { background: #e5e7eb; color: #374151; }
    .btn--danger    { background: #ef4444; color: white;   }
  `]
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirmar acao';
  @Input() message = 'Tem certeza que deseja continuar?';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
