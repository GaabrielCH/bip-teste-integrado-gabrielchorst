import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BeneficioService } from './beneficio.service';
import { Beneficio, PageResponse } from '../models/beneficio.model';
import { environment } from '../../../environments/environment';

describe('BeneficioService', () => {
  let service: BeneficioService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/beneficios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BeneficioService]
    });
    service = TestBed.inject(BeneficioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve criar o servico', () => {
    expect(service).toBeTruthy();
  });

  it('findAll deve chamar endpoint correto', () => {
    const mockPage: PageResponse<Beneficio> = {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    };

    service.findAll({ page: 0, size: 10, sortBy: 'id', direction: 'ASC' }).subscribe(res => {
      expect(res).toEqual(mockPage);
    });

    const req = httpMock.expectOne(r => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('findById deve chamar endpoint correto', () => {
    const mockBeneficio = { id: 1, nome: 'Beneficio A' } as Beneficio;
    service.findById(1).subscribe(res => expect(res).toEqual(mockBeneficio));
    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBeneficio);
  });

  it('create deve enviar POST', () => {
    const payload = { nome: 'Novo', descricao: null, valor: 100, ativo: true };
    const mockResponse = { id: 5, ...payload } as Beneficio;

    service.create(payload).subscribe(res => expect(res.id).toBe(5));
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('update deve enviar PUT', () => {
    const payload = { nome: 'Atualizado', descricao: null, valor: 200, ativo: true };
    service.update(1, payload).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, ...payload });
  });

  it('delete deve enviar DELETE', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('transfer deve enviar POST para /transferencia', () => {
    const payload = { fromId: 1, toId: 2, amount: 100 };
    service.transfer(payload).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/transferencia`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });
});
