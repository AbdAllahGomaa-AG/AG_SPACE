import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly emailError = signal('');
  readonly passwordError = signal('');

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.signIn(this.email(), this.password());

    if (result.success) {
      await this.router.navigate(['/']);
    } else {
      this.errorMessage.set(result.error ?? 'Login failed');
    }

    this.isLoading.set(false);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  clearFieldError(field: 'email' | 'password'): void {
    if (field === 'email') {
      this.emailError.set('');
    } else {
      this.passwordError.set('');
    }
  }

  private validateForm(): boolean {
    let isValid = true;

    if (!this.email()) {
      this.emailError.set('Email is required');
      isValid = false;
    } else if (!this.isValidEmail(this.email())) {
      this.emailError.set('Please enter a valid email');
      isValid = false;
    }

    if (!this.password()) {
      this.passwordError.set('Password is required');
      isValid = false;
    } else if (this.password().length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
