import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslatorService {
  private translations: any = {};
  private currentLang: string = localStorage.getItem('lang') || 'es';
  private listeners: (() => void)[] = [];

  async loadTranslations(lang: string): Promise<void> {
    if (this.translations[lang]) {
      this.currentLang = lang;
      this.notifyListeners();
      return;
    }
    const response = await fetch(`/assets/i18n/${lang}.json`);
    this.translations[lang] = await response.json();
    this.currentLang = lang;
    this.notifyListeners();
  }

  translate(key: string): string {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    return key;
  }

  setLang(lang: string) {
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.loadTranslations(lang);
    this.notifyListeners();
  }

  getLang(): string {
    return this.currentLang;
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }
}
