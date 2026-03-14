import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Beneficio, CreateBeneficioRequest, UpdateBeneficioRequest } from '../../../../core/models/beneficio.model';

@Component({
  selector: 'app-beneficio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible) {
      <div class="overlay" (click)="onCancel()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2 class="modal__title">{{ beneficio ? 'Editar Beneficio' : 'Novo Beneficio' }}</h2>
            <button class="modal__close" (click)="onCancel()">x</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal__body">
            <div class="field">
              <label class="field__label" for="nome">Nome</label>
              <input id="nome" class="field__input" formControlName="nome" placeholder="Nome do beneficio" />
              @if (f['nome'].invalid && f['nome'].touched) {
                <span class="field__error">{{ getError('nome') }}</span>
              }
            </div>

            <div class="field">
              <label class="field__label" for="descricao">Descricao</label>
              <input id="descricao" class="field__input" formControlName="descricao" placeholder="Descricao (opcional)" />
            </div>

            <div class="field">
              <label class="field__label" for="valor">Valor (R$)</label>
              <input id="valor" type="number" step="0.01" min="0" class="field__input" formControlName="valor" placeholder="0.00" />
              @if (f['valor'].invalid && f['valor'].touched) {
                <span class="field__error">{{ getError('valor') }}</span>
              }
            </div>

            <div class="field field--checkbox">
              <input id="ativo" type="checkbox" formControlName="ativo" />
              <label class="field__label" for="ativo">Beneficio ativo</label>
            </div>

            <div class="modal__actions">
              <button type="button" class="btn btn--secondary" (click)="onCancel()">Cancelar</button>
              <button type="submit" class="btn btn--primary" [disabled]="form.invalid || saving">
                {{ saving ? 'Salvando...' : 'Salvar' }}
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
      max-width: 480px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      overflow: hidden;
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

    .field { margin-bottom: 1rem; }
    .field--checkbox { display: flex; align-items: center; gap: 0.5rem; }

    .field__label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }

    .field__input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 5px;
      font-size: 0.875rem;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .field__input:focus { outline: none; border-color: #3b82f6; }

    .field__error { font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; display: block; }

    .btn { padding: 0.5rem 1.25rem; border: none; border-radius: 5px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
    .btn:hover    { opacity: 0.85; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--primary   { background: #3b82f6; color: white; }
    .btn--secondary { background: #e5e7eb; color: #374151; }
  `]
})
export class BeneficioFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() beneficio: Beneficio | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<CreateBeneficioRequest | UpdateBeneficioRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.buildForm();
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset();
      if (this.beneficio) {
        this.form.patchValue({
          nome: this.beneficio.nome,
          descricao: this.beneficio.descricao,
          valor: this.beneficio.valor,
          ativo: this.beneficio.ativo
        });
      } else {
        this.form.patchValue({ ativo: true });
      }
    }
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.value);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getError(field: string): string {
    const control = this.f[field];
    if (control.hasError('required')) return 'Campo obrigatorio.';
    if (control.hasError('maxlength')) return `Maximo de ${control.errors?.['maxlength'].requiredLength} caracteres.`;
    if (control.hasError('min')) return 'Valor deve ser maior ou igual a zero.';
    return 'Valor invalido.';
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      nome:     ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', Validators.maxLength(255)],
      valor:    [null, [Validators.required, Validators.min(0)]],
      ativo:    [true, Validators.required]
    });
  }
}
