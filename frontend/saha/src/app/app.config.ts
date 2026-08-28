import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Translation files live at public/i18n/en.json and public/i18n/ar.json.
    provideTranslateHttpLoader({
      prefix: '/i18n/',
      suffix: '.json',
      enforceLoading: true,
      useHttpBackend: false
    }),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      // Explicitly named here too — without this, provideTranslateService's
      // own default loader registration can end up winning over the one
      // above, silently returning {} for every language with no HTTP call
      // at all (this was the actual bug).
      loader: TranslateHttpLoader
    })
  ]
};