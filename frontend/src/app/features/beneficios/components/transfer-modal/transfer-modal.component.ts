import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Beneficio, TransferRequest } from '../../../../core/models/beneficio.model';
import { BrlPipe } from '../../../../shared/pipes/brl.pipe';

@Component({
  selector: 'app-transfer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BrlPipe],
  template: `
    @if (visible && fromBeneficio) {
      <div class="overlay" (click)="onCancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2 class="modal__title">Transferir Valor</h2>
            <button class="modal__close" (click)="onCancel()">x</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal__body">
            <div class="info-box">
              <div class="info-box__row">
                <span class="info-box__label">Origem:</span>
                <span class="info-box__value">{{ fromBeneficio.nome }}</span>
              </div>
              <div class="info-box__row">
                <span class="info-box__label">Saldo disponivel:</span>
                <span class="info-box__value info-box__value--highlight">{{ fromBeneficio.valor | brl }}</span>
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="toId">Beneficio de Destino</label>
              <select id="toId" class="field__input" formControlName="toId">
                <option value="">Selecione...</option>
                @for (b of availableBeneficios; track b.id) {
                  <option [value]="b.id">{{ b.nome }} ({{ b.valor | brl }})</option>
                }
              </select>
              @if (f['toId'].invalid && f['toId'].touched) {
                <span class="field__error">Selecione o beneficio de destino.</span>
              }
            </div>

            <div class="field">
              <label class="field__label" for="amount">Valor a Transferir (R$)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                [max]="fromBeneficio.valor"
                class="field__input"
                formControlName="amount"
                placeholder="0.00"
              />
              @if (f['amount'].invalid && f['amount'].touched) {
                <span class="field__error">{{ getAmountError() }}</span>
              }
            </div>

            <div class="modal__actions">
              <button type="button" class="btn btn--secondary" (click)="onCancel()">Cancelar</button>
              <button type="submit" class="btn btn--primary" [disabled]="form.invalid || transferring">
                {{ transferring ? 'Transferindo...' : 'Transferir' }}
              </button>
            </div>
          </form>
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
      z-index: 400;
    }

    .modal {
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }

    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal__title { margin: 0; font-size: 1.125rem; font-weight: 600; }

    .modal__close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #6b7280;
    }
    .modal__close:hover { color: #111; }

    .modal__body { padding: 1.5rem; }

    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .info-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 0.875rem 1rem;
      margin-bottom: 1.25rem;
    }
    .info-box__row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .info-box__row:last-child { margin-bottom: 0; }
    .info-box__label { font-size: 0.8125rem; color: #0369a1; font-weight: 500; }
    .info-box__value { font-size: 0.8125rem; color: #0c4a6e; }
    .info-box__value--highlight { font-weight: 700; font-size: 1rem; color: #0369a1; }

    .field { margin-bottom: 1rem; }
    .field__label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
    .field__input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 5px;
      font-size: 0.875rem;
      box-sizing: border-box;
    }
    .field__input:focus { outline: none; border-color: #3b82f6; }
    .field__error { font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; display: block; }

    .btn { padding: 0.5rem 1.25rem; border: none; border-radius: 5px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
    .btn:hover    { opacity: 0.85; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--primary   { background: #6366f1; color: white; }
    .btn--secondary { background: #e5e7eb; color: #374151; }
  `]
})
export class TransferModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() fromBeneficio: Beneficio | null = null;
  @Input() allBeneficios: Beneficio[] = [];
  @Input() transferring = false;
  @Output() transfer = new EventEmitter<TransferRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      toId:   ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset();
    }
  }

  get f() { return this.form.controls; }

  get availableBeneficios(): Beneficio[] {
    return this.allBeneficios.filter(
      b => b.ativo && b.id !== this.fromBeneficio?.id
    );
  }

  onSubmit(): void {
    if (this.form.invalid || !this.fromBeneficio) return;
    this.transfer.emit({
      fromId: this.fromBeneficio.id,
      toId:   +this.form.value.toId,
      amount: +this.form.value.amount
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getAmountError(): string {
    const ctrl = this.f['amount'];
    if (ctrl.hasError('required')) return 'Campo obrigatorio.';
    if (ctrl.hasError('min')) return 'O valor deve ser maior que zero.';
    return 'Valor invalido.';
  }
}
