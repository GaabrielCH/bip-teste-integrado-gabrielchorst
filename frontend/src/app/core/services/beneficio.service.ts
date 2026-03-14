import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Beneficio,
  BeneficioFilter,
  CreateBeneficioRequest,
  PageResponse,
  TransferRequest,
  UpdateBeneficioRequest
} from '../models/beneficio.model';

@Injectable({ providedIn: 'root' })
export class BeneficioService {

  private readonly baseUrl = `${environment.apiUrl}/beneficios`;

  constructor(private http: HttpClient) {}

  findAll(filter: BeneficioFilter): Observable<PageResponse<Beneficio>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('size', filter.size)
      .set('sortBy', filter.sortBy)
      .set('direction', filter.direction);

    if (filter.nome) {
      return this.http.get<PageResponse<Beneficio>>(`${this.baseUrl}/busca`, {
        params: params.set('nome', filter.nome)
      });
    }

    return this.http.get<PageResponse<Beneficio>>(this.baseUrl, { params });
  }

  findById(id: number): Observable<Beneficio> {
    return this.http.get<Beneficio>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateBeneficioRequest): Observable<Beneficio> {
    return this.http.post<Beneficio>(this.baseUrl, request);
  }

  update(id: number, request: UpdateBeneficioRequest): Observable<Beneficio> {
    return this.http.put<Beneficio>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  transfer(request: TransferRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/transferencia`, request);
  }
}
