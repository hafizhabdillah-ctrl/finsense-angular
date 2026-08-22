import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UmkmProfile } from '../core/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  activeTab: 'user' | 'umkm' = 'user';
  loading = true;
  saving = false;
  error = '';
  userForm = { full_name: '', email: '' };
  umkmForm: UmkmProfile = {};
  private readonly auth = inject(AuthService);

  ngOnInit(): void { this.loadProfiles(); }

  async loadProfiles(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const user = this.auth.user();
      this.userForm = { full_name: user?.full_name || '', email: user?.email || '' };
      this.umkmForm = await this.auth.getUmkmProfile();
    } catch {
      this.error = 'Gagal memuat data pengaturan.';
    } finally {
      this.loading = false;
    }
  }

  async saveUser(): Promise<void> {
    this.saving = true;
    this.error = '';
    try { await this.auth.updateProfile(this.userForm.full_name.trim(), this.userForm.email.trim()); this.saved.emit(); this.closed.emit(); }
    catch (error: any) { this.error = error?.error?.error || 'Gagal memperbarui profil user.'; }
    finally { this.saving = false; }
  }

  async saveUmkm(): Promise<void> {
    this.saving = true;
    this.error = '';
    try {
      await this.auth.updateUmkmProfile({ ...this.umkmForm, monthly_revenue_est: this.umkmForm.monthly_revenue_est ? Number(this.umkmForm.monthly_revenue_est) : null, employee_count: this.umkmForm.employee_count ? Number(this.umkmForm.employee_count) : null });
      this.saved.emit(); this.closed.emit();
    } catch (error: any) { this.error = error?.error?.error || 'Gagal memperbarui profil UMKM.'; }
    finally { this.saving = false; }
  }
}
