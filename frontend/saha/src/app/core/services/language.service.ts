import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'saha.language';

export type AppLanguage = 'en' | 'ar';

/**
 * Owns which language the app is showing, keeps it saved across visits, and
 * flips the whole page to right-to-left for Arabic. Call setLanguage() once
 * at app startup (see app.ts) so the very first render is already in the
 * right language/direction — not just after the translations load.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly currentLang = signal<AppLanguage>('en');

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);

    const saved = (localStorage.getItem(STORAGE_KEY) as AppLanguage | null) || 'en';
    this.setLanguage(saved);
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLang.set(lang);
    // use() returns an Observable — it's lazy, so it must be subscribed to
    // actually trigger loading/switching the language.
    this.translate.use(lang).subscribe();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggle(): void {
    this.setLanguage(this.currentLang() === 'en' ? 'ar' : 'en');
  }
}