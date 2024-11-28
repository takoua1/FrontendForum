import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js'; // Pour le chiffrement (facultatif)
const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const REFRESH_TOKEN_KEY = 'refresh-token'; // Ajout de la clé pour le refresh token

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  constructor() {}

  // Effacer les données d'authentification
  signOut(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY); // Enlever également le refresh token
  }

  // Sauvegarder le jeton d'accès (token) après chiffrement
  public saveToken(token: string): void {
    const encryptedToken = crypto.AES.encrypt(token, 'secret-key').toString();
    window.localStorage.setItem(TOKEN_KEY, encryptedToken);
  }

  // Récupérer le jeton d'accès (token) et le déchiffrer
  public getToken(): string | null {
    const encryptedToken = window.localStorage.getItem(TOKEN_KEY);
    if (encryptedToken) {
      const bytes = crypto.AES.decrypt(encryptedToken, 'secret-key');
      return bytes.toString(crypto.enc.Utf8);
    }
    return null;
  }

  // Sauvegarder l'utilisateur
  public saveUser(user: any): void {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Récupérer l'utilisateur
  public getUser(): any {
    const user = window.localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Sauvegarder le refresh token
  public saveRefreshToken(refreshToken: string): void {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Récupérer le refresh token
  public getRefreshToken(): string | null {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Vérifier si le jeton a expiré (en utilisant JWT)
  public isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1])); // Décoder le payload JWT
    return payload.exp < Math.floor(Date.now() / 1000); // Comparer l'expiration avec le temps actuel
  }
}
