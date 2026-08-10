import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  // ── Sales ──────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'inquiries/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inquiry/new-inquiry/new-inquiry').then(m => m.NewInquiryComponent)
  },
  {
    path: 'inquiries/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inquiry/inquiry-detail/inquiry-detail').then(m => m.InquiryDetailComponent)
  },
  {
    path: 'inquiries',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inquiry/pipeline/pipeline').then(m => m.PipelineComponent)
  },

  // ── Quotes ─────────────────────────────────────────
  {
    path: 'quotes/preview/:shareToken',
    loadComponent: () => import('./features/quotes/quote-preview').then((m) => m.QuotePreview)
  },
  {
    path: 'quotes/:inquiryId/:quoteId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quotes/quote-builder').then((m) => m.QuoteBuilder)
  },
  {
    path: 'quotes/:inquiryId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quotes/quote-list').then((m) => m.QuoteList)
  },

 // ── Events ─────────────────────────────────────────
{
  path: 'events/summary/:inquiryId',
  loadComponent: () => import('./features/events/event-summary').then((m) => m.EventSummaryPage)
},
{
  path: 'events/dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./features/events/events-director-dashboard/events-director-dashboard').then((m) => m.EventsDirectorDashboardPage)
},
{
  path: 'events/requests/:inquiryId',
  canActivate: [authGuard],
  loadComponent: () => import('./features/events/events-team-detail/events-team-detail').then((m) => m.EventsTeamDetailPage)
},
{
  path: 'events/:inquiryId',
  canActivate: [authGuard],
  loadComponent: () => import('./features/events/event-setup').then((m) => m.EventSetupPage)
},
{
  path: 'events',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/events/events-list/events-list').then(m => m.EventsList)
},

  // ── Setup ──────────────────────────────────────────
  {
    path: 'hotel-profile',
    canActivate: [authGuard],
    loadComponent: () => import('./hotel-profile/hotel-profile').then((m) => m.HotelProfile)
  },
  {
    path: 'availability',
    canActivate: [authGuard],
    loadComponent: () => import('./features/availability/hall-availability-calendar').then((m) => m.HallAvailabilityCalendar)
  },
  {
    path: 'setup/users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/hotel-users/hotel-users').then(m => m.HotelUsers)
  },
  {
    path: 'setup/reference-data',
    canActivate: [authGuard],
    loadComponent: () => import('./features/setup/reference-data').then((m) => m.ReferenceData)
  },
  {
    path: 'setup/source-channels',
    canActivate: [authGuard],
    loadComponent: () => import('./features/setup/source-channels').then((m) => m.SourceChannels)
  },
  {
    path: 'setup/quote-settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/setup/quote-settings').then((m) => m.QuoteSettingsPage)
  },

  // ── Reporting ──────────────────────────────────────
  {
    path: 'reporting',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reporting/reporting').then((m) => m.Reporting)
  },
  {
    path: 'reporting/lost-reasons',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reporting/lost-reason-analysis/lost-reason-analysis').then((m) => m.LostReasonAnalysisPage)
  },
  {
    path: 'reporting/response-time',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reporting/response-time-analysis/response-time-analysis').then((m) => m.ResponseTimeAnalysisPage)
  },
  {
    path: 'export',
    canActivate: [authGuard],
    loadComponent: () => import('./features/export/export').then((m) => m.Export)
  },

 // ── Admin ──────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-panel/admin-panel').then(m => m.AdminPanel)
  },
  {
    path: 'admin/hotels/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/create-hotel/create-hotel').then(m => m.CreateHotel)
  },
  {
    path: 'admin/hotels/:id/users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/hotel-users/hotel-users').then(m => m.HotelUsers)
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];