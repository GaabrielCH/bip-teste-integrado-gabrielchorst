import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Beneficio } from '../../../../core/models/beneficio.model';
import { BrlPipe } from '../../../../shared/pipes/brl.pipe';

@Component({
  selector: 'app-beneficio-list',
  standalone: true,
  imports: [CommonModule, BrlPipe],
  template: `
    <div class="list-container">
      <table class="table">
        <thead>
          <tr>
            <th (click)="sort('id')" class="sortable">
              ID <span class="sort-icon">{{ getSortIcon('id') }}</span>
            </th>
            <th (click)="sort('nome')" class="sortable">
              Nome <span class="sort-icon">{{ getSortIcon('nome') }}</span>
            </th>
            <th>Descricao</th>
            <th (click)="sort('valor')" class="sortable">
              Valor <span class="sort-icon">{{ getSortIcon('valor') }}</span>
            </th>
            <th>Status</th>
            <th class="actions-col">Acoes</th>
          </tr>
        </thead>
        <tbody>
          @if (loading) {
            <tr>
              <td colspan="6" class="empty-state">Carregando...</td>
            </tr>
          } @else if (beneficios.length === 0) {
            <tr>
              <td colspan="6" class="empty-state">Nenhum beneficio encontrado.</td>
            </tr>
          } @else {
            @for (b of beneficios; track b.id) {
              <tr [class.row--inactive]="!b.ativo">
                <td>{{ b.id }}</td>
                <td>{{ b.nome }}</td>
                <td>{{ b.descricao || '-' }}</td>
                <td>{{ b.valor | brl }}</td>
                <td>
                  <span class="badge" [class.badge--active]="b.ativo" [class.badge--inactive]="!b.ativo">
                    {{ b.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="actions-col">
                  <button class="btn btn--icon btn--info" title="Transferir" (click)="transfer.emit(b)">T</button>
                  <button class="btn btn--icon btn--primary" title="Editar" (click)="edit.emit(b)">E</button>
                  <button class="btn btn--icon btn--danger" title="Excluir" (click)="delete.emit(b)">X</button>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>

      <div class="pagination">
        <span class="pagination__info">
          {{ totalElements }} registro(s) — Pagina {{ currentPage + 1 }} de {{ totalPages }}
        </span>
        <div class="pagination__controls">
          <button class="btn btn--secondary" [disabled]="currentPage === 0" (click)="pageChange.emit(currentPage - 1)">Anterior</button>
          <button class="btn btn--secondary" [disabled]="currentPage >= totalPages - 1" (click)="pageChange.emit(currentPage + 1)">Proximo</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-container { width: 100%; }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .table th, .table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      user-select: none;
    }

    .table th.sortable { cursor: pointer; }
    .table th.sortable:hover { background: #f3f4f6; }

    .sort-icon { font-size: 0.75rem; margin-left: 4px; color: #9ca3af; }

    .table tbody tr:hover { background: #f9fafb; }
    .row--inactive { opacity: 0.6; }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge--active   { background: #dcfce7; color: #166534; }
    .badge--inactive { background: #fee2e2; color: #991b1b; }

    .actions-col { white-space: nowrap; }

    .btn { padding: 0.375rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8125rem; font-weight: 500; transition: opacity 0.15s; }
    .btn:hover    { opacity: 0.85; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn--icon    { width: 2rem; height: 2rem; padding: 0; margin: 0 2px; }
    .btn--primary   { background: #3b82f6; color: white; }
    .btn--secondary { background: #e5e7eb; color: #374151; }
    .btn--info      { background: #6366f1; color: white; }
    .btn--danger    { background: #ef4444; color: white; }

    .empty-state { text-align: center; color: #9ca3af; padding: 2rem; }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      margin-top: 0.5rem;
    }
    .pagination__info { font-size: 0.8125rem; color: #6b7280; }
    .pagination__controls { display: flex; gap: 0.5rem; }
  `]
})
export class BeneficioListComponent {
  @Input() beneficios: Beneficio[] = [];
  @Input() loading = false;
  @Input() totalElements = 0;
  @Input() totalPages = 0;
  @Input() currentPage = 0;
  @Input() sortBy = 'id';
  @Input() sortDirection: 'ASC' | 'DESC' = 'ASC';

  @Output() edit = new EventEmitter<Beneficio>();
  @Output() delete = new EventEmitter<Beneficio>();
  @Output() transfer = new EventEmitter<Beneficio>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ sortBy: string; direction: 'ASC' | 'DESC' }>();

  sort(field: string): void {
    const direction: 'ASC' | 'DESC' =
      this.sortBy === field && this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.sortChange.emit({ sortBy: field, direction });
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'ASC' ? '▲' : '▼';
  }
}
