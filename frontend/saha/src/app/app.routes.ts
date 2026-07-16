import { Routes } from '@angular/router';

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
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'inquiries/new',
    loadComponent: () =>
      import('./features/inquiry/new-inquiry/new-inquiry').then(m => m.NewInquiryComponent)
  },
  {
    path: 'inquiries/:id',
    loadComponent: () =>
      import('./features/inquiry/inquiry-detail/inquiry-detail').then(m => m.InquiryDetailComponent)
  },
  {
    path: 'inquiries',
    loadComponent: () =>
      import('./features/inquiry/pipeline/pipeline').then(m => m.PipelineComponent)
  },
  {
    path: 'hotel-profile',
    loadComponent: () => import('./hotel-profile/hotel-profile').then((m) => m.HotelProfile)
  },
  {
    path: 'setup/reference-data',
    loadComponent: () => import('./features/setup/reference-data').then((m) => m.ReferenceData)
  },
  {
    path: 'setup/source-channels',
    loadComponent: () => import('./features/setup/source-channels').then((m) => m.SourceChannels)
  },
  {
    path: 'setup/quote-settings',
    loadComponent: () => import('./features/setup/quote-settings').then((m) => m.QuoteSettingsPage)
  },
  {
    path: 'setup/readiness',
    loadComponent: () => import('./features/setup/readiness').then((m) => m.PilotReadiness)
  },
  {
    path: 'quotes',
    loadComponent: () => import('./features/quotes/quotes-placeholder').then((m) => m.QuotesPlaceholder)
  },
  {
    path: 'quotes/preview/:shareToken',
    loadComponent: () => import('./features/quotes/quote-preview').then((m) => m.QuotePreview)
  },
  {
    path: 'quotes/:inquiryId',
    loadComponent: () => import('./features/quotes/quote-list').then((m) => m.QuoteList)
  },
  {
    path: 'quotes/:inquiryId/:quoteId',
    loadComponent: () => import('./features/quotes/quote-builder').then((m) => m.QuoteBuilder)
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/events-placeholder').then((m) => m.EventsPlaceholder)
  },
  {
    path: 'events/summary/:inquiryId',
    loadComponent: () => import('./features/events/event-summary').then((m) => m.EventSummaryPage)
  },
  {
    path: 'events/:inquiryId',
    loadComponent: () => import('./features/events/event-setup').then((m) => m.EventSetupPage)
  },
  {
    path: 'reporting',
    loadComponent: () => import('./features/reporting/reporting').then((m) => m.Reporting)
  },
  {
    path: 'export',
    loadComponent: () => import('./features/export/export').then((m) => m.Export)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];