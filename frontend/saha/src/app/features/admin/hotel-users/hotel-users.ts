import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { AdminPageHeader } from '../../../shared/admin-page-header/admin-page-header';
import { StatusBadge } from '../../../shared/mobile/status-badge/status-badge';

@Component({
  selector: 'app-hotel-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, AdminPageHeader, StatusBadge],
  templateUrl: './hotel-users.html',
  styleUrl: './hotel-users.scss'
})
export class HotelUsers implements OnInit {
  tenantId = '';
  hotelName = '';
  users: any[] = [];
  isLoading = true;
  showInviteForm = false;
  isInviting = false;
  errorFields: string[] = [];
  /** True when reached via /admin/hotels/:id/users (SAHA Admin picking a hotel from the list). */
  isAdminContext = false;

  // Edit user
  showEditForm = false;
  isSavingEdit = false;
  editErrorFields: string[] = [];
  editingUserId = '';
  editForm = {
    fullName: '',
    role: 'SALES_REP'
  };

  inviteForm = {
    fullName: '',
    email: '',
    role: 'SALES_REP',
    status: 'INVITED'
  };

  /**
   * Values kept in English regardless of app language — these match the
   * backend's role enum. Only the *displayed* label is translated, via
   * getRoleLabelKey() below.
   */
  roles = [
    { value: 'DIRECTOR_OF_SALES', label: 'Director of Sales' },
    { value: 'SALES_REP', label: 'Sales Rep' },
    { value: 'EVENTS_TEAM', label: 'Events Team' },
    { value: 'EVENTS_DIRECTOR', label: 'Events Director' },
  ];

  private roleKeyMap: Record<string, string> = {
    DIRECTOR_OF_SALES: 'hotelUsers.roleOptions.directorOfSales',
    SALES_REP: 'hotelUsers.roleOptions.salesRep',
    EVENTS_TEAM: 'hotelUsers.roleOptions.eventsTeam',
    EVENTS_DIRECTOR: 'hotelUsers.roleOptions.eventsDirector',
  };

  private userStatusKeyMap: Record<string, string> = {
    ACTIVE: 'hotelUsers.userStatus.active',
    INVITED: 'hotelUsers.userStatus.invited',
    INACTIVE: 'hotelUsers.userStatus.inactive',
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private authService: AuthService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const idFromUrl = this.route.snapshot.paramMap.get('id');
    this.isAdminContext = !!idFromUrl;
    // Director of Sales reaches this page with no :id in the URL — use their own hotel.
    this.tenantId = idFromUrl || this.authService.getTenantId();
    this.loadUsers();
    this.loadHotel();
  }

  loadHotel() {
    this.http.get<any>(`${environment.apiBaseUrl}/api/tenants/${this.tenantId}`).subscribe({
      next: (data) => {
        this.hotelName = data.name;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadUsers() {
    this.http.get<any[]>(`${environment.apiBaseUrl}/api/users/tenant/${this.tenantId}`).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  validate(): boolean {
    this.errorFields = [];
    if (!this.inviteForm.fullName) this.errorFields.push('fullName');
    if (!this.inviteForm.email) this.errorFields.push('email');
    if (!this.inviteForm.role) this.errorFields.push('role');
    return this.errorFields.length === 0;
  }

  hasError(field: string): boolean {
    return this.errorFields.includes(field);
  }

  inviteUser() {
    if (!this.validate()) return;
    this.isInviting = true;
    this.http.post(`${environment.apiBaseUrl}/api/users`, {
      ...this.inviteForm,
      tenantId: this.tenantId
    }).subscribe({
      next: () => {
        this.isInviting = false;
        this.showInviteForm = false;
        this.inviteForm = { fullName: '', email: '', role: 'SALES_REP', status: 'INVITED' };
        this.loadUsers();
      },
      error: () => {
        this.isInviting = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Flips a user between ACTIVE and INACTIVE. For an INVITED user, this is how you activate them. */
  toggleStatus(user: any) {
    if (user.role === 'SAHA_ADMIN' && user.status === 'ACTIVE') {
      alert(this.translateService.instant('hotelUsers.cannotDeactivateAdminAlert'));
      return;
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.http.put(`${environment.apiBaseUrl}/api/users/${user.id}`, {
      ...user,
      status: newStatus
    }).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        alert(err?.error?.message || 'Failed to update status.');
        this.cdr.detectChanges();
      }
    });
  }

  // --- Edit user ---
  openEdit(user: any) {
    this.editingUserId = user.id;
    this.editForm = { fullName: user.fullName, role: user.role };
    this.editErrorFields = [];
    this.showEditForm = true;
  }

  validateEdit(): boolean {
    this.editErrorFields = [];
    if (!this.editForm.fullName) this.editErrorFields.push('fullName');
    if (!this.editForm.role) this.editErrorFields.push('role');
    return this.editErrorFields.length === 0;
  }

  hasEditError(field: string): boolean {
    return this.editErrorFields.includes(field);
  }

  saveEdit() {
    if (!this.validateEdit()) return;
    const user = this.users.find(u => u.id === this.editingUserId);
    if (!user) return;
    this.isSavingEdit = true;
    this.http.put(`${environment.apiBaseUrl}/api/users/${this.editingUserId}`, {
      ...user,
      fullName: this.editForm.fullName,
      role: this.editForm.role
    }).subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.showEditForm = false;
        this.loadUsers();
      },
      error: () => {
        this.isSavingEdit = false;
        this.cdr.detectChanges();
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.roles.find(r => r.value === role)?.label || role;
  }

  /** Translation key for a role, e.g. 'SALES_REP' -> 'hotelUsers.roleOptions.salesRep'. */
  getRoleLabelKey(role: string): string {
    return this.roleKeyMap[role] || role;
  }

  /** Translation key for a user status, e.g. 'ACTIVE' -> 'hotelUsers.userStatus.active'. */
  getUserStatusKey(status: string): string {
    return this.userStatusKeyMap[status] || status;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}