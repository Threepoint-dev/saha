import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-create-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-hotel.html',
  styleUrl: './create-hotel.scss'
})
export class CreateHotel {
  isLoading = false;
  errorFields: string[] = [];

  form = {
    name: '',
    city: '',
    district: '',
    address: '',
    phone: '',
    mainContactName: '',
    mainContactEmail: '',
    mainContactPhone: '',
    pilotStatus: 'SETUP_PENDING',
    isActive: true
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  validate(): boolean {
    this.errorFields = [];
    if (!this.form.name) this.errorFields.push('name');
    if (!this.form.city) this.errorFields.push('city');
    if (!this.form.mainContactEmail) this.errorFields.push('mainContactEmail');
    return this.errorFields.length === 0;
  }

  hasError(field: string): boolean {
    return this.errorFields.includes(field);
  }

  submit() {
    if (!this.validate()) return;
    this.isLoading = true;
    this.http.post(`${environment.apiBaseUrl}/api/tenants`, this.form).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}