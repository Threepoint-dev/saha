import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type LoginStep = 'email' | 'check-email' | 'enter-code' | 'signed-in';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnDestroy {
  step = signal<LoginStep>('email');
  email = signal('');
  otp = signal('');
  errorMessage = signal('');
  resendTimer = signal(30);
  canResend = signal(false);
  private timerInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async sendCode() {
    if (!this.email()) return;
    const result = await this.authService.sendOtp(this.email());
    if (result.success) {
      this.step.set('check-email');
      this.startResendTimer();
    } else {
      this.errorMessage.set(result.error || 'Failed to send code');
    }
  }

  goToEnterCode() {
    this.step.set('enter-code');
  }

  async verifyCode() {
    if (!this.otp()) return;
    const result = await this.authService.verifyOtp(this.email(), this.otp());
    if (result.success) {
      this.step.set('signed-in');
    } else {
      this.errorMessage.set('That code is incorrect or expired. Try again.');
      this.otp.set('');
    }
  }

  async requestNewCode() {
    this.otp.set('');
    this.errorMessage.set('');
    const result = await this.authService.sendOtp(this.email());
    if (result.success) {
      this.startResendTimer();
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  private startResendTimer() {
    this.resendTimer.set(30);
    this.canResend.set(false);
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const current = this.resendTimer();
      if (current <= 1) {
        this.resendTimer.set(0);
        this.canResend.set(true);
        clearInterval(this.timerInterval);
      } else {
        this.resendTimer.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  isLoading() {
    return this.authService.isLoading();
  }
}