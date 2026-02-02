import {Component, HostListener, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterModule, RoutesRecognized} from '@angular/router';
import {Subject, takeUntil, forkJoin, debounceTime, switchMap, of, filter} from 'rxjs';
import {CommonModule} from '@angular/common';
import {SessionService} from '../../services/session.service';
import {RecipeService} from '../../services/recipe.service';
import {IngredientService} from '../../services/ingredient.service';
import {RecipeCollectionService} from '../../services/recipe-collection.service';
import {UserService} from '../../services/user.service';
import {CollectionCardComponent} from '../shared/collection-card/collection-card.component';
import {TranslatorService} from '../../services/translator.service';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule, CollectionCardComponent],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  quickSearchActive = false;
  quickSearchQuery = '';
  quickSearchLoading = false;
  quickSearchResults: {
    recipes: any[],
    ingredients: any[],
    collections: any[],
    users: any[]
  } = {recipes: [], ingredients: [], collections: [], users: []};
  quickSearchError = '';
  quickSearchDebounce$ = new Subject<string>();

  themes: { theme: string; icon: string; }[] = [];

  bowlIcon: string = "assets/icons/bowl-spoon.svg";

  currentLanguage = localStorage.getItem('lang') || 'es';
  currentLanguageText = 'Language';
  isAuthenticated = false;
  isAdmin = false;
  user: any = null;
  isLogoClicked: boolean = false;

  showCollectionView = false;
  selectedCollection: any = undefined;
  navItem: string = 'home';

  langDropdownOpen = false;
  rotateLang: boolean = false;
  selectedTheme: string = localStorage.getItem("selectedTheme") || "tangerine-light";
  selectedThemeInd: number = 1;

  logos: Map<string, string> = new Map();

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private sessionService: SessionService,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private collectionService: RecipeCollectionService,
    private userService: UserService,
    public translator: TranslatorService
  ) {
  }

  t(key: string): string {
    return this.translator.translate(key);
  }

  ngOnInit(): void {
    this.logos = this.themeService.getLogos();

    document.addEventListener("DOMContentLoaded", () => {
      this.themeService.changeTheme(this.selectedTheme);
    })

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof RoutesRecognized)
    ).subscribe((event) => {
      if (event.url.length < 2) {
        this.navItem = '';
      } else if (event.url.includes('/admin-panel')) {
        this.navItem = 'admin-panel';
      } else if (event.url.includes('/explore')) {
        this.navItem = 'explore';
      } else if (event.url.includes('/ingredients')) {
        this.navItem = 'ingredients';
      } else {
        this.navItem = undefined as any;
      }
    });

    switch (this.currentLanguage) {
      case 'en':
        this.currentLanguageText = 'English';
        break;
      case 'es':
        this.currentLanguageText = 'Español';
        break;
      case 'fr':
        this.currentLanguageText = 'Français';
        break;
      case 'ja':
        this.currentLanguageText = '日本語';
        break;
      case 'zh':
        this.currentLanguageText = '中文';
        break;
      default:
        this.currentLanguageText = 'Language';
        break;
    }

    this.themes = this.themeService.getThemes();


    this.quickSearchDebounce$
      .pipe(
        debounceTime(200),
        switchMap((query) => {
          if (!query || query.trim().length === 0) {
            this.quickSearchResults = {recipes: [], ingredients: [], collections: [], users: []};
            return of(null);
          }
          this.quickSearchLoading = true;
          return forkJoin({
            recipes: this.recipeService.getFilteredRecipes({query}, 0, 3).pipe(
              switchMap(res => of(res.recipes?.slice(0, 3) || []))
            ),
            ingredients: this.ingredientService.getPagedIngredients(0, 3).pipe(
              switchMap(res => {
                if (!query) return of(res.content.slice(0, 3));
                return of(res.content.filter(i => i.food.toLowerCase().includes(query.toLowerCase())).slice(0, 3));
              })
            ),
            collections: this.collectionService.getPopularPublicCollections(10).pipe(
              switchMap(res => {
                if (!query) return of(res.slice(0, 3));
                return of(res.filter(c => c.title.toLowerCase().includes(query.toLowerCase())).slice(0, 3));
              })
            ),
            users: this.userService.searchUsers(query, 0, 3).pipe(
              switchMap(res => of((res.users || res.content || []).slice(0, 3)))
            )
          });
        })
      )
      .subscribe({
        next: (results: any) => {
          if (!results) return;
          this.quickSearchResults = results;
          this.quickSearchLoading = false;
        },
        error: (err) => {
          this.quickSearchError = 'Error loading quick search results.';
          this.quickSearchLoading = false;
        }
      });

    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user) {
          this.isAuthenticated = false;
          this.isAdmin = false;
          return;
        }
        this.isAuthenticated = true;
        this.user = user;
        this.isAdmin = user.role === 'ADMIN';
      },
      error: () => {
        this.isAuthenticated = false;
        this.isAdmin = false;
      }
    });

    const selectedLangText = document.getElementById('selectedLangText');
    if (selectedLangText) {
      switch (this.currentLanguage) {
        case 'en':
          selectedLangText.textContent = 'English';
          break;
        case 'es':
          selectedLangText.textContent = 'Español';
          break;
        case 'fr':
          selectedLangText.textContent = 'Français';
          break;
        case 'ja':
          selectedLangText.textContent = '日本語';
          break;
        case 'zh':
          selectedLangText.textContent = '中文';
          break;
        default:
          selectedLangText.textContent = 'Idioma';
          break;
      }
    }

    this.translator.loadTranslations(this.currentLanguage);
    window.addEventListener('storage', (event) => {
      if (event.key === 'lang') {
        this.currentLanguage = event.newValue || 'es';
        this.translator.loadTranslations(this.currentLanguage);
      }
    });
    this.translator.onChange(() => {
      this.currentLanguage = this.translator.getLang();
    });
    this.themeService.onChange(() => {
      this.selectedTheme = this.themeService.getCurrentTheme();
      this.selectedThemeInd = this.themeService.getSelectedThemeIndex();
    })
  }

  onQuickSearchFocus() {
    this.quickSearchActive = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.getElementById('quick-search-input');
      input?.focus();
    }, 0);
  }

  onQuickSearchBlur() {
    setTimeout(() => {
      this.quickSearchActive = false;
    }, 200);
  }

  onQuickSearchInput(event: any) {
    this.quickSearchQuery = (event?.target as HTMLInputElement)?.value || '';
    this.quickSearchDebounce$.next(this.quickSearchQuery);
  }

  clearQuickSearch() {
    this.quickSearchQuery = '';
    this.quickSearchResults = {recipes: [], ingredients: [], collections: [], users: []};
  }

  goToExplore() {
    this.navigateTo('explore');
    setTimeout(() => this.quickSearchActive = false, 100);
  }

  showCollection(collection: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showCollectionView = true;
    this.selectedCollection = collection;
    this.quickSearchActive = false;
  }

  closeCollectionView(): void {
    this.showCollectionView = false;
    this.selectedCollection = undefined;
  }


  logoClicked(): void {
    if (!this.isLogoClicked) {
      window.scrollTo({top: 0, behavior: 'smooth'});
      this.isLogoClicked = true;
      setTimeout(() => this.isLogoClicked = false, 800);
    }
  }

  onHover(isHovering: boolean): void {
    this.bowlIcon = isHovering ? "assets/icons/bowl-spoon-stir.svg" : "assets/icons/bowl-spoon-withdraw.svg";
  }

  selectItem(event: Event): void {
    const item = (event.target as HTMLElement).closest('.dropdown-item');

    if (item) {
      this.themeService.changeTheme(item.id);
      item?.classList.add("selected");
    }
  }

  navigateTo(route: string, event?: Event, closeQuickSearch: boolean = true): void {
    if (route === 'profile' && !this.isAuthenticated) {
      route = 'login';
    } else if (route === 'profile' && this.isAuthenticated) {
      this.sessionService.getLoggedUser().pipe(takeUntil(new Subject<void>())).subscribe(user => {
        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
          this.router.navigate(['/users', user.username]);
        });
      });
      return;
    }

    this.router.navigate(['/' + route]);

    if (closeQuickSearch) {
      setTimeout(() => this.quickSearchActive = false, 100);
    }
    let currentNavButton = (event?.target as HTMLElement).closest('.nav-item') as HTMLElement;
    let navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      if (item.classList.contains('active')) {
        item.classList.remove('active')
        let label = item.children[0] as HTMLElement;
        label.classList.forEach(c => {
          if (c.endsWith('-filled')) {
            label.classList.remove(c);
            label.classList.add(c.replace('-filled', ''));
          }
        });
      }
    });

    if (!currentNavButton) return;
    currentNavButton.classList.add('active');
    let label = currentNavButton.children[0] as HTMLElement;
    label.classList.forEach(c => {
      if (c.startsWith('ti-') && !c.endsWith('-filled')) {
        label.classList.remove(c);
        label.classList.add(c + '-filled');
      }
    });
  }

  closeLangDropdown() {
    this.langDropdownOpen = false;
    const checkbox = document.getElementById('dropdownLangCheckbox') as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
    const menu = document.getElementById('dropdownLangMenu');
    if (menu) menu.classList.remove('open');
  }

  toggleLangDropdown() {
    this.langDropdownOpen = !this.langDropdownOpen;
    const checkbox = document.getElementById('dropdownLangCheckbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = this.langDropdownOpen;
      this.rotateLang = true;
    }
    const menu = document.getElementById('dropdownLangMenu');
    if (menu) menu.classList.toggle('open', this.langDropdownOpen);
  }

  selectLanguage(event: Event): void {
    const item = (event.target as HTMLButtonElement).closest('.dropdown-item');
    if (item) {
      const lang = item.getAttribute('data-lang');
      this.currentLanguage = lang || 'es';
      localStorage.setItem('lang', this.currentLanguage);
      this.translator.setLang(this.currentLanguage);
      const selectedLangText = document.getElementById('selectedLangText');
      if (selectedLangText) {
        switch (this.currentLanguage) {
          case 'en':
            selectedLangText.textContent = 'English';
            break;
          case 'es':
            selectedLangText.textContent = 'Español';
            break;
          case 'fr':
            selectedLangText.textContent = 'Français';
            break;
          case 'ja':
            selectedLangText.textContent = '日本語';
            break;
          case 'zh':
            selectedLangText.textContent = '中文';
            break;
          default:
            selectedLangText.textContent = 'Idioma';
            break;
        }
      }
      this.closeLangDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    // Close all dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('.dropdown-container');
    dropdowns.forEach(container => {
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (!container.contains(event.target as Node) || (event.target as HTMLElement).closest('#dropdownMenu')) {
        checkbox.checked = false;
        if (container.id === 'dropdownLangCheckbox') {
          this.closeLangDropdown();
          this.rotateLang = false;
        }
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {

    const dropdown = document.getElementById('dropdownMenu');

    if (event.key === 'Escape') {
      dropdown?.classList.remove("open");
    }
  }

  onLogout(): void {
    this.sessionService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']).then(() => {
          window.location.reload();
        })
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Even if there's an error, reload the page to clear the session
        window.location.reload();
      }
    });
  }
}
