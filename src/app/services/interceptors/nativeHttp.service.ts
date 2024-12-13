import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { Platform } from '@ionic/angular';
import { TokenStorageService } from '../token-storage.service';
import { AuthService } from '../auth.service';

@Injectable()
export class NativeHttpInterceptor implements HttpInterceptor {
  constructor(
    private tokenStorageService: TokenStorageService,
    private authService: AuthService,
    private platform: Platform
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifie si l'environnement est mobile
    if (this.platform.is('capacitor') && req.url.startsWith('http')) {
      const token = this.tokenStorageService.getToken();

      // Cloner la requête pour ajouter le token
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      return next.handle(req).pipe(
        catchError((error) => {
          // Si l'erreur est 401, essayez de rafraîchir le token
          if (error.status === 401) {
            return this.refreshAndRetry(req, next);
          }
          throw error;
        })
      );
    }

    // Si ce n'est pas un environnement natif, passe la requête telle quelle
    return next.handle(req);
  }

  private refreshAndRetry(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.refreshToken().pipe(
      switchMap((newToken) => {
        this.tokenStorageService.saveToken(newToken);
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
          },
        });
        return next.handle(clonedRequest);
      })
    );
  }
}
