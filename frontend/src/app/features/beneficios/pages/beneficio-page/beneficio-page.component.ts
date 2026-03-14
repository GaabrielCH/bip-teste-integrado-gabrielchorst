import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BeneficioService } from '../../../../core/services/beneficio.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Beneficio,
  BeneficioFilter,
  CreateBeneficioRequest,
  TransferRequest,
  UpdateBeneficioRequest
} from '../../../../core/models/beneficio.model';
import { BeneficioListComponent } from '../../components/beneficio-list/beneficio-list.component';
import { BeneficioFormComponent } from '../../components/beneficio-form/beneficio-form.component';
import { TransferModalComponent } from '../../components/transfer-modal/transfer-modal.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-beneficio-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BeneficioListComponent,
    BeneficioFormComponent,
    TransferModalComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__header-content">
          <div>
            <h1 class="page__title">Beneficios</h1>
            <p class="page__subtitle">Gerencie os beneficios da empresa</p>
          </div>
          <button class="btn btn--primary" (click)="openCreateModal()">Novo Beneficio</button>
        </div>
      </header>

      <main class="page__body">
        <div class="toolbar">
          <div class="search-box">
            <input
              class="search-box__input"
              type="text"
              placeholder="Buscar por nome..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()"
            />
          </div>
          <div class="toolbar__right">
            <label class="filter-label">
              <input type="checkbox" [(ngModel)]="showOnlyActive" (change)="loadBeneficios()" />
              Somente ativos
            </label>
          </div>
        </div>

        <div class="card">
          <app-beneficio-list
            [beneficios]="beneficios"
            [loading]="loading"
            [totalElements]="totalElements"
            [totalPages]="totalPages"
            [currentPage]="filter.page"
            [sortBy]="filter.sortBy"
            [sortDirection]="filter.direction"
            (edit)="openEditModal($event)"
            (delete)="openDeleteConfirm($event)"
            (transfer)="openTransferModal($event)"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
          />
        </div>
      </main>
    </div>

    <app-beneficio-form
      [visible]="formVisible"
      [beneficio]="selectedBeneficio"
      [saving]="saving"
      (save)="onSave($event)"
      (cancel)="closeForm()"
    />

    <app-transfer-modal
      [visible]="transferVisible"
      [fromBeneficio]="selectedBeneficio"
      [allBeneficios]="allBeneficios"
      [transferring]="transferring"
      (transfer)="onTransfer($event)"
      (cancel)="closeTransfer()"
    />

    <app-confirm-dialog
      [visible]="deleteVisible"
      title="Excluir Beneficio"
      [message]="'Deseja excluir o beneficio &quot;' + (selectedBeneficio?.nome ?? '') + '&quot;? Esta acao nao pode ser desfeita.'"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="closeDelete()"
    />
  `,
  styles: [`
    .page { min-height: 100vh; background: #f3f4f6; }

    .page__header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1.5rem 2rem;
    }

    .page__header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page__title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111827; }
    .page__subtitle { margin: 0.25rem 0 0; font-size: 0.875rem; color: #6b7280; }

    .page__body {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .toolbar__right { display: flex; align-items: center; }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }

    .search-box__input {
      padding: 0.5rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 5px;
      font-size: 0.875rem;
      width: 300px;
    }
    .search-box__input:focus { outline: none; border-color: #3b82f6; }

    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      overflow: hidden;
    }

    .btn { padding: 0.5rem 1.25rem; border: none; border-radius: 5px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
    .btn:hover    { opacity: 0.85; }
    .btn--primary { background: #3b82f6; color: white; }
  `]
})
export class BeneficioPageComponent implements OnInit {

  beneficios: Beneficio[] = [];
  allBeneficios: Beneficio[] = [];
  loading = false;
  saving = false;
  transferring = false;

  totalElements = 0;
  totalPages = 0;

  filter: BeneficioFilter = {
    page: 0,
    size: 10,
    sortBy: 'id',
    direction: 'ASC'
  };

  searchTerm = '';
  showOnlyActive = false;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  formVisible = false;
  transferVisible = false;
  deleteVisible = false;
  selectedBeneficio: Beneficio | null = null;

  constructor(
    private beneficioService: BeneficioService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBeneficios();
    this.loadAllBeneficios();
  }

  loadBeneficios(): void {
    this.loading = true;
    const filterToUse: BeneficioFilter = { ...this.filter };
    if (this.searchTerm.trim()) {
      filterToUse.nome = this.searchTerm.trim();
    }

    this.beneficioService.findAll(filterToUse).subscribe({
      next: (page) => {
        this.beneficios = this.showOnlyActive
          ? page.content.filter(b => b.ativo)
          : page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadAllBeneficios(): void {
    this.beneficioService.findAll({ page: 0, size: 100, sortBy: 'nome', direction: 'ASC' })
      .subscribe({ next: (page) => { this.allBeneficios = page.content; } });
  }

  onSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.filter.page = 0;
      this.loadBeneficios();
    }, 350);
  }

  onPageChange(page: number): void {
    this.filter.page = page;
    this.loadBeneficios();
  }

  onSortChange(event: { sortBy: string; direction: 'ASC' | 'DESC' }): void {
    this.filter.sortBy = event.sortBy;
    this.filter.direction = event.direction;
    this.filter.page = 0;
    this.loadBeneficios();
  }

  openCreateModal(): void {
    this.selectedBeneficio = null;
    this.formVisible = true;
  }

  openEditModal(beneficio: Beneficio): void {
    this.selectedBeneficio = beneficio;
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.selectedBeneficio = null;
  }

  onSave(data: CreateBeneficioRequest | UpdateBeneficioRequest): void {
    this.saving = true;
    const request$ = this.selectedBeneficio
      ? this.beneficioService.update(this.selectedBeneficio.id, data as UpdateBeneficioRequest)
      : this.beneficioService.create(data as CreateBeneficioRequest);

    request$.subscribe({
      next: () => {
        this.toast.success(this.selectedBeneficio ? 'Beneficio atualizado.' : 'Beneficio criado.');
        this.saving = false;
        this.closeForm();
        this.loadBeneficios();
        this.loadAllBeneficios();
      },
      error: () => { this.saving = false; }
    });
  }

  openTransferModal(beneficio: Beneficio): void {
    this.selectedBeneficio = beneficio;
    this.transferVisible = true;
  }

  closeTransfer(): void {
    this.transferVisible = false;
    this.selectedBeneficio = null;
  }

  onTransfer(request: TransferRequest): void {
    this.transferring = true;
    this.beneficioService.transfer(request).subscribe({
      next: () => {
        this.toast.success('Transferencia realizada com sucesso.');
        this.transferring = false;
        this.closeTransfer();
        this.loadBeneficios();
        this.loadAllBeneficios();
      },
      error: () => { this.transferring = false; }
    });
  }

  openDeleteConfirm(beneficio: Beneficio): void {
    this.selectedBeneficio = beneficio;
    this.deleteVisible = true;
  }

  closeDelete(): void {
    this.deleteVisible = false;
    this.selectedBeneficio = null;
  }

  onDeleteConfirmed(): void {
    if (!this.selectedBeneficio) return;
    this.beneficioService.delete(this.selectedBeneficio.id).subscribe({
      next: () => {
        this.toast.success('Beneficio excluido.');
        this.closeDelete();
        this.loadBeneficios();
        this.loadAllBeneficios();
      }
    });
  }
}
