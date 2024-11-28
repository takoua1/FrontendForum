import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorageService } from '../token-storage.service';
import { catchError, Observable, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private tokenStorageService: TokenStorageService, private authService: AuthService) {

   }

   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ajouter le jeton d'accès dans les en-têtes de la requête si disponible
    let token = this.tokenStorageService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Gérer les erreurs liées au jeton expiré
    return next.handle(req).pipe(
      catchError((error) => {
        // Si l'erreur est liée à l'expiration du jeton (par exemple code 401)
        if (error.status === 401) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              // Après avoir rafraîchi le jeton, reprendre la requête avec le nouveau jeton
              const newToken = this.tokenStorageService.getToken();
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next.handle(clonedRequest);
            })
          );
        }
        throw error; // Relancer l'erreur si ce n'est pas un problème de jeton expiré
      })
    );
   }}
export const authInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true }
];

