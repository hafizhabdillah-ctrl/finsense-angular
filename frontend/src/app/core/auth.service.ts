import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from './environment';

export interface User {
  id?: string;
  email: string;
  full_name?: string;
  umkm_profile?: UmkmProfile;
}

export interface UmkmProfile {
  business_name?: string;
  business_type?: string;
  province?: string;
  city?: string;
  monthly_revenue_est?: number | null;
  employee_count?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  private readonly sessionReady: Promise<void>;

  constructor(private readonly http: HttpClient) {
    this.sessionReady = this.restoreSession();
  }

  waitForSession(): Promise<void> { return this.sessionReady; }

  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.http.post<{ accessToken: string; refreshToken: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, password }));
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    this.user.set(result.user);
    this.loading.set(false);
  }

  async register(email: string, password: string, fullName: string): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      full_name: fullName,
    }));
  }

  async updateProfile(fullName: string, email: string): Promise<User> {
    const user = await firstValueFrom(this.http.put<User>(`${environment.apiUrl}/auth/profile`, { full_name: fullName, email }));
    this.user.update((current) => current ? { ...current, ...user } : user);
    return user;
  }

  async getUmkmProfile(): Promise<UmkmProfile> {
    return firstValueFrom(this.http.get<UmkmProfile>(`${environment.apiUrl}/umkm`));
  }

  async updateUmkmProfile(profile: UmkmProfile): Promise<UmkmProfile> {
    const updated = await firstValueFrom(this.http.post<UmkmProfile>(`${environment.apiUrl}/umkm`, profile));
    this.user.update((current) => current ? { ...current, umkm_profile: updated } : current);
    return updated;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }));
      } catch {
        // Clear the local session even when the server is unavailable.
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.user.set(null);
  }

  private async restoreSession(): Promise<void> {
    if (!localStorage.getItem('accessToken')) {
      this.loading.set(false);
      return;
    }
    try {
      this.user.set(await firstValueFrom(this.http.get<User>(`${environment.apiUrl}/auth/profile`)));
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      this.loading.set(false);
    }
  }
}
