import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  error = '';
  submitting = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async submit(): Promise<void> {
    this.error = '';
    if (this.password !== this.confirmPassword) {
      this.error = 'Password dan konfirmasi password tidak cocok.';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password minimal 6 karakter.';
      return;
    }
    if (this.fullName.trim().length < 3) {
      this.error = 'Nama lengkap minimal 3 karakter.';
      return;
    }

    this.submitting = true;
    try {
      await this.auth.register(this.email.trim(), this.password, this.fullName.trim());
      await this.router.navigate(['/login'], { queryParams: { registered: 'success' } });
    } catch (error: any) {
      this.error = error?.error?.error || error?.error?.message || 'Registrasi gagal. Email mungkin sudah terdaftar.';
    } finally {
      this.submitting = false;
    }
  }
}
