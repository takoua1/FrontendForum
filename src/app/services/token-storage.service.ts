import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { BehaviorSubject } from 'rxjs';


const TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'refresh-token';
const USER_KEY = 'auth-user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private tokenCache: string | null = null;
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor() {
    this.loadToken();
  }

  // Vérifie si l'environnement est le Web
  private isWeb(): boolean {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  }

  // Charge le token au démarrage
  private async loadToken(): Promise<void> {
    if (this.isWeb()) {
      this.tokenCache = window.localStorage.getItem(TOKEN_KEY);
      this.tokenSubject.next(this.tokenCache);
    } else {
      const { value } = await Storage.get({ key: TOKEN_KEY });
      this.tokenCache = value;
      this.tokenSubject.next(this.tokenCache);
    }
  }

  // Se déconnecter et effacer les tokens
  signOut(): void {
    if (this.isWeb()) {
      window.localStorage.clear();
    } else {
      Storage.clear();
    }
    this.tokenCache = null;
    this.tokenSubject.next(null);
  }

  // Sauvegarder le token
  public saveToken(token: string): void {
    if (this.isWeb()) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      Storage.set({ key: TOKEN_KEY, value: token });
    }
    this.tokenCache = token;
    this.tokenSubject.next(token);
  }

  // Récupérer le token
  public getToken(): string | null {
    return this.tokenCache;
  }

  // Sauvegarder le refresh token
  public saveRefreshToken(refreshToken: string): void {
    if (this.isWeb()) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      Storage.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
    }
  }

  // Récupérer le refresh token
  public getRefreshToken(): string | null {
    if (this.isWeb()) {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null; // Pas de cache de refresh token pour les natifs dans cette implémentation
  }

  // Sauvegarder l'utilisateur
  public saveUser(user: any): void {
    if (this.isWeb()) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      Storage.set({ key: USER_KEY, value: JSON.stringify(user) });
    }
  }

  // Récupérer l'utilisateur
  public getUser(): any {
    if (this.isWeb()) {
      const user = window.localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : {};
    }
    return {}; // Pas de cache d'utilisateur pour les natifs
  }

  // Observable pour le token
  public getTokenObservable(): BehaviorSubject<string | null> {
    return this.tokenSubject;
  }
}