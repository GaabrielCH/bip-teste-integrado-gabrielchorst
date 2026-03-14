import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'beneficios',
    pathMatch: 'full'
  },
  {
    path: 'beneficios',
    loadComponent: () =>
      import('./features/beneficios/pages/beneficio-page/beneficio-page.component')
        .then(m => m.BeneficioPageComponent)
  },
  {
    path: '**',
    redirectTo: 'beneficios'
  }
];
