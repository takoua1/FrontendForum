import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';


import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { TokenStorageService } from '../token-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private tokenStorageService: TokenStorageService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenStorageService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error) => {
        // Si le jeton est expiré (ou tout autre type d'erreur), rafraîchir le jeton
        if (error.status === 401) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              // Rejouer la requête avec le nouveau jeton
              const newToken = this.tokenStorageService.getToken();
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                }
              });
              return next.handle(clonedRequest);
            })
          );
        }
        throw error;
      })
    );
  }
}
