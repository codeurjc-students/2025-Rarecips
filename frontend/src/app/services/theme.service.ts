import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private logos = new Map([
    ['Rarecips_Flip', ''],
    ['Rarecips_Iconologo', ''],
    ['Rarecips_Iconologo2', ''],
    ['Rarecips_Iconotipo', ''],
    ['Rarecips_Imagotipo', ''],
    ['Rarecips_Isologo', ''],
    ['Rarecips_Isotipo', ''],
    ['Rarecips_Logotipo', ''],
    ['Rarecips_Spinner', ''],
    ['Rarecips_Stir', '']
  ]);

  private currentTheme: string = localStorage.getItem('selectedTheme') || 'tangerine-light';

  private themes = [
    {theme: "tangerine-light", icon: "lemon"},
    {theme: "tangerine-dark", icon: "lemon"},
    {theme: "ocean-light", icon: "droplet"},
    {theme: "ocean-dark", icon: "droplet"},
    {theme: "forest-light", icon: "leaf-2"},
    {theme: "forest-dark", icon: "leaf-2"},
    {theme: "rose-light", icon: "flower"},
    {theme: "rose-dark", icon: "flower"},
    {theme: "neutral-light", icon: "rectangle-rounded-top"},
    {theme: "neutral-dark", icon: "rectangle-rounded-top"}
  ];

  private listeners: (() => void)[] = [];
  private selectedThemeInd: number = -1;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'selectedTheme') {
        const newTheme = event.newValue || 'tangerine-light';
        if (this.currentTheme !== newTheme) {
          this.changeTheme(newTheme);
          this.notifyListeners();
        }
      }
    });
  }

  getIcon(iconName: string): Observable<string> {
    return this.http.get(`assets/icons/${iconName}.svg`, {responseType: 'text'});
  }

  getLogos(): Map<string, string> {
    for (let logoKey of this.logos.keys()) {
      this.getIcon(logoKey).subscribe({
        next: svg => {
          this.logos.set(logoKey, this.sanitizer.bypassSecurityTrustHtml(svg) as string);
        },
        error: err => {
          console.error('Error loading icon:', err);
        }
      })
    }
    return this.logos;
  }

  setFavicon(logoName: string): void {
    let faviconLink: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(faviconLink);
    }
    this.getIcon(logoName).subscribe({
      next: svg => {
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        if (faviconLink) {
          faviconLink.href = url;
        }
      },
      error: err => {
        console.error('Error loading favicon icon:', err);
      }
    });
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
  }

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  getThemes(): {theme: string, icon: string}[] {
    return this.themes;
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }

  changeTheme(selectedTheme: string) {
    this.currentTheme = selectedTheme;
    localStorage.setItem('selectedTheme', selectedTheme);
    this.setFavicon(`Iconotipo_${selectedTheme}` || 'Iconotipo_tangerine_light');

    const dropdown = document.getElementById('dropdownMenu');
    const body = document.querySelector('body');
    const navbar = document.getElementById('navbar');

    dropdown?.querySelectorAll('.dropdown-item').forEach(el => {
      el.classList.remove("selected");
    });

    const item = dropdown?.querySelectorAll(".dropdown-item.theme-" + selectedTheme)[0];
    item?.classList.add("selected");

    this.selectedThemeInd = this.themes.findIndex(t => t.theme === selectedTheme);

    this.themes.forEach(theme => {
      if (theme.theme != selectedTheme) {
        body?.classList.remove("theme-" + theme.theme);
        navbar?.classList.remove("theme-" + theme.theme);
      }
    });
    body?.classList.add("theme-" + selectedTheme + "");
    navbar?.classList.add("theme-" + selectedTheme + "");

    this.notifyListeners();
  }

  getSelectedThemeIndex() {
    return this.selectedThemeInd;
  }
}
