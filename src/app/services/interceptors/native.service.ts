import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';
import { TokenStorageService } from '../token-storage.service';
import { AuthService } from '../auth.service';

@Injectable()
export class NativeService implements HttpInterceptor {
  constructor(
    private tokenStorageService: TokenStorageService,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this.tokenStorageService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    if (Capacitor.isNativePlatform() && req.url.startsWith('http')) {
      const options = this.createOptions(req);
      return from(Http.request(options)).pipe(
        map((response) => {
          return new HttpResponse({
            body: response.data || response,
            status: response.status,
            url: req.url,
          });
        }),
        catchError((error) => {
          if (error.status === 401) {
            return this.refreshAndRetry(options);
          }
          throw error;
        })
      );
    }

    return next.handle(req);
  }

  private createOptions(req: HttpRequest<any>) {
    return {
      url: req.url,
      method: req.method,
      headers: req.headers.keys().reduce((acc, key) => {
        acc[key] = req.headers.get(key)!;
        return acc;
      }, {} as Record<string, string>),
      params: req.params.keys().reduce((acc, key) => {
        acc[key] = req.params.get(key)!;
        return acc;
      }, {} as Record<string, string>),
      data: req.body,
    };
  }

  private refreshAndRetry(options: any) {
    return this.authService.refreshToken().pipe(
      switchMap(() => {
        const newToken = this.tokenStorageService.getToken();
        options.headers['Authorization'] = `Bearer ${newToken}`;
        return from(Http.request(options)).pipe(
          map((response) => {
            return new HttpResponse({
              body: response.data || response,
              status: response.status,
              url: options.url,
            });
          })
        );
      })
    );
  }
}