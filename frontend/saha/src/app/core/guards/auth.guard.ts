import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Enforces the SAHA Phase 0.5 Role / Access Matrix at the route level.
 * The sidebar only controls what a role *sees*; this guard is what actually
 * stops a role from reaching a page by typing the URL directly.
 */
export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Waits for the user's profile to finish loading before checking role,
  // so a hard refresh can't read an empty role and bounce a valid user.
  const user = await authService.ensureUserLoaded();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const role = user.role;
  const path = route.routeConfig?.path || '';

  const deny = () => {
    router.navigate([homeFor(role)]);
    return false;
  };

  // Admin & Tenant Management — SAHA_ADMIN only.
  if (path.startsWith('admin') && role !== 'SAHA_ADMIN') {
    return deny();
  }

  // Setup (hotel profile, halls/packages/add-ons, source channels, quote & VAT
  // settings, user management) — SAHA_ADMIN and Director of Sales only.
  if ((path.startsWith('setup') || path === 'hotel-profile') &&
      role !== 'SAHA_ADMIN' && role !== 'DIRECTOR_OF_SALES') {
    return deny();
  }

  // Events Team Request Tracker & Detail — Events Team and Events Director only.
  if ((path === 'events' || path === 'events/requests/:inquiryId') &&
      role !== 'EVENTS_TEAM' && role !== 'EVENTS_DIRECTOR') {
    return deny();
  }

  // Events Director Dashboard — Events Director only.
  if (path === 'events/dashboard' && role !== 'EVENTS_DIRECTOR') {
    return deny();
  }

  // Sales-side event setup (reached from an inquiry) — everyone except Events Team.
  if (path === 'events/:inquiryId' && role === 'EVENTS_TEAM') {
    return deny();
  }

  // Reporting & Export — not for Sales Rep or Events Team (operational roles only).
  if ((path === 'reporting' || path === 'export') &&
      (role === 'SALES_REP' || role === 'EVENTS_TEAM')) {
    return deny();
  }

  // Hall Availability — not for Events Team (matches the role matrix; they work
  // off the BEO the Sales team shares, not the raw calendar).
  if (path === 'availability' && role === 'EVENTS_TEAM') {
    return deny();
  }

  // Sales workflow (inquiries, new inquiry, quotes) — not for Events Team.
  if ((path.startsWith('inquiries') || path.startsWith('quotes')) && role === 'EVENTS_TEAM') {
    return deny();
  }

  // Sales dashboard — not for Events Team / Events Director (they have their own home).
  if (path === 'dashboard' && (role === 'EVENTS_TEAM' || role === 'EVENTS_DIRECTOR')) {
    return deny();
  }

  return true;
};

function homeFor(role: string): string {
  switch (role) {
    case 'SAHA_ADMIN': return '/admin';
    case 'EVENTS_TEAM':
    case 'EVENTS_DIRECTOR': return '/events';
    default: return '/dashboard';
  }
}