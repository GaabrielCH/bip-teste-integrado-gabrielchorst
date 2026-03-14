export interface Beneficio {
  id: number;
  nome: string;
  descricao: string | null;
  valor: number;
  ativo: boolean;
  version: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBeneficioRequest {
  nome: string;
  descricao: string | null;
  valor: number;
  ativo: boolean;
}

export interface UpdateBeneficioRequest {
  nome: string;
  descricao: string | null;
  valor: number;
  ativo: boolean;
}

export interface TransferRequest {
  fromId: number;
  toId: number;
  amount: number;
}

export interface BeneficioFilter {
  page: number;
  size: number;
  sortBy: string;
  direction: 'ASC' | 'DESC';
  nome?: string;
}
