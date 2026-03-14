import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractErrorMessage(error);
      toast.error(message);
      return throwError(() => error);
    })
  );
};

function extractErrorMessage(error: HttpErrorResponse): string {
  if (error.error?.detail) {
    return error.error.detail;
  }
  if (error.error?.message) {
    return error.error.message;
  }
  switch (error.status) {
    case 400: return 'Dados invalidos. Verifique os campos e tente novamente.';
    case 404: return 'Recurso nao encontrado.';
    case 422: return 'Operacao nao permitida. Verifique as regras de negocio.';
    case 500: return 'Erro interno do servidor. Tente novamente em instantes.';
    default:  return 'Ocorreu um erro inesperado.';
  }
}
