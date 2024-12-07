import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { Platform } from '@ionic/angular';
import { from, Observable } from 'rxjs';
import { TokenStorageService } from '../token-storage.service';
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'upload' | 'download';

@Injectable({
  providedIn: 'root'
})
export class NativeService implements HttpInterceptor{

  constructor(
    private nativeHttp: HTTP, // Pour utiliser les requêtes natives
    private platform: Platform,
    private tokenStorageService: TokenStorageService // Pour récupérer le token
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.platform.is('capacitor')) {
      // Si on n'est pas sur un appareil mobile (Capacitor), on passe la requête comme d'habitude
      return next.handle(req);
    }

    return from(this.handleNativeRequest(req));
  }

  private async handleNativeRequest(request: HttpRequest<any>): Promise<HttpEvent<any>> {
    const token = this.tokenStorageService.getToken();
    const headers: { [key: string]: string } = {};

    // Ajouter le token aux en-têtes si disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Ajouter les autres en-têtes de la requête
    request.headers.keys().forEach(key => {
      headers[key] = request.headers.get(key) || '';
    });

    try {
      // Attendre que la plateforme soit prête
      await this.platform.ready();

      // Utilisation de `@ionic-native/http` pour envoyer la requête native
      const response = await this.nativeHttp.sendRequest(request.url, {
        method: <HttpMethod>request.method.toLowerCase(),
        headers: headers,
        data: request.body,
        serializer: 'json',
      });

      // Créer la réponse et la retourner
      return {
        body: JSON.parse(response.data),
        status: response.status,
        url: response.url
      } as HttpEvent<any>;
    } catch (error: any) {
      // Gérer les erreurs et les renvoyer sous forme de HttpEvent
      return Promise.reject({
        body: error.error ? JSON.parse(error.error) : 'Error',
        status: error.status || 500,
        url: request.url
      } as HttpEvent<any>);
    }
  }
}