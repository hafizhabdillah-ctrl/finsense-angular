import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  submitting = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async submit(): Promise<void> {
    this.error = '';
    this.submitting = true;
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error = 'Email atau password tidak valid.';
    } finally {
      this.submitting = false;
    }
  }
}
