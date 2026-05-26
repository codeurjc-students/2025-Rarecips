import {ChangeDetectorRef, Component, HostListener, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterModule, RoutesRecognized} from '@angular/router';
import {Subject, takeUntil, forkJoin, debounceTime, switchMap, of, filter} from 'rxjs';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {SessionService} from '../../services/session.service';
import {RecipeService} from '../../services/recipe.service';
import {IngredientService} from '../../services/ingredient.service';
import {RecipeCollectionService} from '../../services/recipe-collection.service';
import {UserService} from '../../services/user.service';
import {CollectionCardComponent} from '../shared/collection-card/collection-card.component';
import {TranslatorService} from '../../services/translator.service';
import {ThemeService} from '../../services/theme.service';
import {NotificationService} from '../../services/notification.service';
import {Notification} from '../../models/notification.model';

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
  isHoveringRecipeBtn: boolean = false;
  anyActiveSections: boolean = false;
  responsive: boolean = window.innerWidth <= 1366;
  navExpanded: boolean = false;
  isDragging: boolean = false;
  isHandlePressed: boolean = false;
  startX: number = 0;
  startTime: number = 0;
  currentWidth: number = 0;
  collapsedWidth: number = 0;
  expandedWidth: number = 240;

  showCollectionView = false;
  selectedCollection: any = undefined;
  navItem: string = '';

  langDropdownOpen = false;
  rotateLang: boolean = false;
  selectedTheme: string = localStorage.getItem("selectedTheme") || "tangerine-light";
  selectedThemeInd: number = 1;

  logos: Map<string, string> = new Map();

  notifications: Notification[] = [];
  unreadCount: number = 0;
  notifDropdownOpen = false;
  bellRingActive = false;

  private bellRingTimer: ReturnType<typeof setTimeout> | null = null;

  showToast: boolean = false;
  toastNotification: Notification | null = null;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private sessionService: SessionService,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private collectionService: RecipeCollectionService,
    private userService: UserService,
    public translator: TranslatorService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
  }

  private recipeTitleCache: Map<number, string> = new Map();

  private enrichNotifications(notifs: Notification[]) {
    if (!notifs || notifs.length === 0) return;

    notifs.forEach(notif => {
      if ((notif as any).messageKey && (notif as any).messageKey.trim().length > 0) {
        const key = (notif as any).messageKey as string;
        const args = (notif as any).messageArgs as { [k: string]: string } | undefined || {};
        this.applyLocalizedNotificationText(notif, key, args, notif.relatedId);
        return;
      }

      if (notif.message && notif.message.trim().length > 0) {
        this.clearLinkedMessageData(notif);
        (notif as any).displayMessage = notif.message;
        return;
      }

      if (notif.type === 'LIKED_RECIPE') {
        if (notif.relatedId) {
          const cached = this.recipeTitleCache.get(notif.relatedId);
          if (cached) {
            this.applyLocalizedNotificationText(notif, 'notification.liked_recipe', { user: notif.senderUsername || this.t('unknown_user'), recipe: cached }, notif.relatedId);
          } else {
            this.recipeService.getRecipeById(notif.relatedId).subscribe({
              next: recipe => {
                const title = recipe?.title || recipe?.label || '';
                this.recipeTitleCache.set(notif.relatedId as number, title);
                this.applyLocalizedNotificationText(notif, 'notification.liked_recipe', { user: notif.senderUsername || this.t('unknown_user'), recipe: title }, notif.relatedId);
                this.cdr.detectChanges();
              },
              error: () => {
                this.applyLocalizedNotificationText(notif, 'notification.liked_recipe', { user: notif.senderUsername || this.t('unknown_user'), recipe: '' }, notif.relatedId);
                this.cdr.detectChanges();
              }
            });
          }
        } else {
          this.applyLocalizedNotificationText(notif, 'notification.liked_recipe', { user: notif.senderUsername || this.t('unknown_user'), recipe: '' });
        }
      } else if (notif.type === 'ADDED_TO_COLLECTION') {
        const collectionLabel = this.t('favorites') || this.t('collections');
        if (notif.relatedId) {
          const cached = this.recipeTitleCache.get(notif.relatedId);
          if (cached) {
            this.applyLocalizedNotificationText(notif, 'notification.added_to_collection', { user: notif.senderUsername || this.t('unknown_user'), recipe: cached, collection: collectionLabel }, notif.relatedId);
          } else {
            this.recipeService.getRecipeById(notif.relatedId).subscribe({
              next: recipe => {
                const title = recipe?.title || recipe?.label || '';
                this.recipeTitleCache.set(notif.relatedId as number, title);
                this.applyLocalizedNotificationText(notif, 'notification.added_to_collection', { user: notif.senderUsername || this.t('unknown_user'), recipe: title, collection: collectionLabel }, notif.relatedId);
                this.cdr.detectChanges();
              },
              error: () => {
                this.applyLocalizedNotificationText(notif, 'notification.added_to_collection', { user: notif.senderUsername || this.t('unknown_user'), recipe: '', collection: collectionLabel }, notif.relatedId);
                this.cdr.detectChanges();
              }
            });
          }
        } else {
          this.applyLocalizedNotificationText(notif, 'notification.added_to_collection', { user: notif.senderUsername || this.t('unknown_user'), recipe: '', collection: collectionLabel });
        }
      } else {
        (notif as any).displayMessage = notif.message || this.t('notifications');
        this.clearLinkedMessageData(notif);
      }
    });
  }

  private applyLocalizedNotificationText(notif: Notification, key: string, args: { [k: string]: string }, relatedId?: number) {
    const template = this.t(key);
    (notif as any).displayMessage = this.formatString(template, args);
    this.buildLinkedMessageParts(notif, template, args, relatedId);
  }

  private formatString(template: string, params: { [k: string]: string }): string {
    if (!template) return '';
    let out = template;
    Object.keys(params || {}).forEach(k => {
      const re = new RegExp(`\\{${k}\\}`, 'g');
      out = out.replace(re, params[k] ?? '');
    });
    return out;
  }

  private clearLinkedMessageData(notif: Notification) {
    (notif as any).displayMessageParts = undefined;
  }

  private buildLinkedMessageParts(notif: Notification, template: string, args: { [k: string]: string }, relatedId?: number) {
    this.clearLinkedMessageData(notif);
    if (!template) return;

    const markerMap: Record<string, { marker: string; text: string; commands?: any[] }> = {
      user: {
        marker: '__RARECIPS_USER__',
        text: args?.['user'] ?? '',
        commands: notif.senderUsername ? ['/users', notif.senderUsername] : undefined
      },
      recipe: {
        marker: '__RARECIPS_RECIPE__',
        text: args?.['recipe'] ?? '',
        commands: relatedId ? ['/recipes', relatedId] : undefined
      }
    };

    const tokens: string[] = [];
    const replacements: { [k: string]: string } = {};

    Object.keys(args || {}).forEach(k => {
      const info = markerMap[k];
      if (info) {
        replacements[k] = info.marker;
        tokens.push(k);
      } else {
        replacements[k] = args[k] ?? '';
      }
    });

    if (tokens.length === 0) return;

    const prepared = this.formatString(template, replacements);
    const parts: { text: string; linkCommands?: any[] }[] = [];
    let cursor = 0;

    while (cursor < prepared.length) {
      let nextPos = -1;
      let nextToken: string | null = null;

      tokens.forEach(token => {
        const marker = markerMap[token].marker;
        const pos = prepared.indexOf(marker, cursor);
        if (pos >= 0 && (nextPos === -1 || pos < nextPos)) {
          nextPos = pos;
          nextToken = token;
        }
      });

      if (nextPos === -1 || !nextToken) {
        const tail = prepared.slice(cursor);
        if (tail) parts.push({ text: tail });
        break;
      }

      const head = prepared.slice(cursor, nextPos);
      if (head) parts.push({ text: head });

      const tokenInfo = markerMap[nextToken];
      parts.push({ text: tokenInfo.text, linkCommands: tokenInfo.commands });
      cursor = nextPos + tokenInfo.marker.length;
    }

    if (parts.some(p => !!p.linkCommands?.length)) {
      (notif as any).displayMessageParts = parts;
    }
  }

  private getLanguageLabel(lang: string): string {
    switch (lang) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      case 'ja':
        return '日本語';
      case 'zh':
        return '中文';
      default:
        return 'Language';
    }
  }

  private syncLanguageUi(): void {
    this.currentLanguageText = this.getLanguageLabel(this.currentLanguage);

    const selectedLangText = document.getElementById('selectedLangText');
    if (selectedLangText) {
      selectedLangText.textContent = this.currentLanguageText;
    }
  }

  private refreshLocalizedNotifications(): void {
    if (this.notifications.length === 0 && !this.toastNotification) return;

    this.notifications = [...this.notifications];
    this.enrichNotifications(this.notifications);

    if (this.toastNotification) {
      this.enrichNotifications([this.toastNotification]);
    }

    this.cdr.detectChanges();
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
      const url = event.url.split('?')[0];
      if (url === '/' || url.length < 2) {
        this.navItem = '';
      } else if (url.startsWith('/admin')) {
        this.navItem = 'admin';
      } else if (url.startsWith('/explore')) {
        this.navItem = 'explore';
      } else if (url.startsWith('/ingredients')) {
        this.navItem = 'ingredients';
      } else if (url.startsWith('/health')) {
        this.navItem = 'health';
      } else {
        this.navItem = 'none';
      }

      let navbar = document.getElementById('navbar') as HTMLElement;
      this.anyActiveSections = !!navbar.querySelector('.nav-item.active');
    });

    this.syncLanguageUi();

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

    this.sessionService.session$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.user = user;
      this.isAdmin = !!user && user.role === 'ADMIN';
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
        this.syncLanguageUi();
        this.translator.loadTranslations(this.currentLanguage);
      }
    });
    this.translator.onChange(() => {
      this.currentLanguage = this.translator.getLang();
      this.syncLanguageUi();
      this.refreshLocalizedNotifications();
    });
    this.themeService.onChange(() => {
      this.selectedTheme = this.themeService.getCurrentTheme();
      this.selectedThemeInd = this.themeService.getSelectedThemeIndex();
    });

    this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.enrichNotifications(notifs);
      this.cdr.detectChanges();
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
      this.cdr.detectChanges();
    });

    this.notificationService.latestNotification$.subscribe(notif => {
      if (notif) {
        this.toastNotification = notif;
        this.showToast = true;
        this.triggerNotificationAnimations();
      } else {
        this.showToast = false;
      }
      this.cdr.detectChanges();
    });
  }

  private triggerNotificationAnimations() {
    this.bellRingActive = false;

    if (this.bellRingTimer) clearTimeout(this.bellRingTimer);

    setTimeout(() => {
      this.bellRingActive = true;
      this.cdr.detectChanges();

      this.bellRingTimer = setTimeout(() => {
        this.bellRingActive = false;
      }, 850);
    }, 0);
  }

  onNavHover(hover: boolean) {
    if (this.responsive) {
      return;
    }
  }

  toggleNav() {
    if (this.responsive) {
      this.navExpanded = !this.navExpanded;
    }
  }

  closeNav() {
    if (this.responsive) {
      this.navExpanded = false;
    }
  }

  onNavTouchStart(event: TouchEvent) {
    if (window.innerWidth > 1366) return;

    const target = event.target as HTMLElement;
    if (target.closest('.quick-search-dropdown') || target.closest('.quick-search-wrapper')) {
      return;
    }

    this.isDragging = true;
    this.startX = event.touches[0].clientX;
    this.collapsedWidth = 80;
    this.currentWidth = this.navExpanded ? this.expandedWidth : this.collapsedWidth;

    const navbar = document.getElementById('navbar');
    const handle = document.querySelector('.nav-drag-handle') as HTMLElement;

    if (navbar) {
      navbar.classList.add('dragging');
    }

    if (handle) {
      handle.classList.add('dragging');
    }
  }

  onNavTouchMove(event: TouchEvent) {
    if (window.innerWidth > 1366 || !this.isDragging) return;

    const target = event.target as HTMLElement;
    if (target.closest('.quick-search-dropdown') || target.closest('.quick-search-wrapper')) {
      return;
    }

    event.preventDefault();

    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.startX;
    let newWidth = this.currentWidth + deltaX;

    newWidth = Math.max(this.collapsedWidth, Math.min(this.expandedWidth, newWidth));

    const navbar = document.getElementById('navbar');
    const handle = document.querySelector('.nav-drag-handle') as HTMLElement;
    const backdrop = document.querySelector('.nav-drag-backdrop') as HTMLElement;

    if (navbar) {
      navbar.style.setProperty('width', `${newWidth}px`, 'important');
      navbar.style.setProperty('max-width', `${newWidth}px`, 'important');
    }

    if (handle) {
      handle.style.left = `${newWidth - 2}px`;
      const progress = (newWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
      const icon = handle.querySelector('i');
      if (icon) {
        (icon as HTMLElement).style.transform = `rotate(${progress * 180}deg)`;
      }
    }

    if (backdrop) {
      const progress = (newWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
      backdrop.style.opacity = `${progress}`;
    }

    const midPoint = (this.collapsedWidth + this.expandedWidth) / 2;
    if (newWidth > midPoint) {
      navbar?.classList.add('expanded');
    } else {
      navbar?.classList.remove('expanded');
    }
  }

  onNavTouchEnd(event: TouchEvent) {
    if (window.innerWidth > 1366 || !this.isDragging) return;

    const target = event.target as HTMLElement;
    if (target.closest('.quick-search-dropdown') || target.closest('.quick-search-wrapper')) {
      this.isDragging = false;
      return;
    }

    const endX = event.changedTouches[0]?.clientX || this.startX;
    const deltaX = endX - this.startX;
    const finalWidth = this.currentWidth + deltaX;
    const midPoint = (this.collapsedWidth + this.expandedWidth) / 2;
    const shouldExpand = finalWidth > midPoint;

    this.navExpanded = shouldExpand;
    this.isDragging = false;
    this.startX = 0;

    const navbar = document.getElementById('navbar');
    const handle = document.querySelector('.nav-drag-handle') as HTMLElement;
    const backdrop = document.querySelector('.nav-drag-backdrop') as HTMLElement;

    if (navbar != null) {
      navbar.classList.remove('dragging');
      navbar.style.width = '';
      navbar.style.maxWidth = '';
      if (shouldExpand) {
        navbar.classList.add('expanded');
      } else {
        navbar.classList.remove('expanded');
      }
    }

    if (handle) {
      handle.classList.remove('dragging');
      handle.style.left = '';
      const icon = handle.querySelector('i');
      if (icon) {
        (icon as HTMLElement).style.transform = '';
      }
    }

    if (backdrop) {
      backdrop.style.opacity = '';
    }
  }

  onHandleTouchStart(event: TouchEvent | MouseEvent) {
    if (window.innerWidth > 1366) return;

    event.stopPropagation();
    event.preventDefault();

    this.isDragging = false;
    this.isHandlePressed = true;
    this.startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.startTime = Date.now();
    this.collapsedWidth = 80;
    this.currentWidth = this.navExpanded ? this.expandedWidth : this.collapsedWidth;
  }

  onHandleTouchMove(event: TouchEvent | MouseEvent) {
    if (window.innerWidth > 1366) return;

    const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    let deltaX = currentX - this.startX;

    if (Math.abs(deltaX) > 5 && !this.isDragging) {
      this.isDragging = true;
      this.startX = currentX;
      deltaX = 0;
      const navbar = document.getElementById('navbar');
      const handle = document.querySelector('.nav-drag-handle') as HTMLElement;

      if (navbar) {
        navbar.classList.add('dragging');
      }

      if (handle) {
        handle.classList.add('dragging');
      }
    }

    if (!this.isDragging) return;

    event.preventDefault();
    event.stopPropagation();

    let newWidth = this.currentWidth + deltaX;

    newWidth = Math.max(this.collapsedWidth, Math.min(this.expandedWidth, newWidth));

    const navbar = document.getElementById('navbar');
    const handle = document.querySelector('.nav-drag-handle') as HTMLElement;
    const backdrop = document.querySelector('.nav-drag-backdrop') as HTMLElement;

    if (navbar) {
      navbar.style.setProperty('width', `${newWidth}px`, 'important');
      navbar.style.setProperty('max-width', `${newWidth}px`, 'important');
    }

    if (handle) {
      handle.style.left = `${newWidth - 2}px`;
      const progress = (newWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
      const icon = handle.querySelector('i');
      if (icon) {
        (icon as HTMLElement).style.transform = `rotate(${progress * 180}deg)`;
      }
    }

    if (backdrop) {
      const progress = (newWidth - this.collapsedWidth) / (this.expandedWidth - this.collapsedWidth);
      backdrop.style.opacity = `${progress}`;
    }

    const midPoint = (this.collapsedWidth + this.expandedWidth) / 2;
    if (newWidth > midPoint) {
      navbar?.classList.add('expanded');
    } else {
      navbar?.classList.remove('expanded');
    }
  }

  onHandleTouchEnd(event: TouchEvent | MouseEvent) {
    if (window.innerWidth > 1366) return;

    event.stopPropagation();
    event.preventDefault();

    const endX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : event.clientX;
    const deltaX = endX - this.startX;
    const duration = Date.now() - this.startTime;

    if (duration < 200 && Math.abs(deltaX) < 10) {
      this.toggleNav();
      this.isDragging = false;
      this.isHandlePressed = false;
      this.startX = 0;
      return;
    }

    if (!this.isDragging) {
      this.startX = 0;
      this.isHandlePressed = false;
      return;
    }

    const finalWidth = this.currentWidth + deltaX;
    const midPoint = (this.collapsedWidth + this.expandedWidth) / 2;
    const shouldExpand = finalWidth > midPoint;

    this.navExpanded = shouldExpand;
    this.isDragging = false;
    this.isHandlePressed = false;
    this.startX = 0;

    const navbar = document.getElementById('navbar');
    const handle = document.querySelector('.nav-drag-handle') as HTMLElement;
    const backdrop = document.querySelector('.nav-drag-backdrop') as HTMLElement;

    if (navbar) {
      navbar.classList.remove('dragging');
      navbar.style.width = '';
      navbar.style.maxWidth = '';
      if (shouldExpand) {
        navbar.classList.add('expanded');
      } else {
        navbar.classList.remove('expanded');
      }
    }

    if (handle) {
      handle.classList.remove('dragging');
      handle.style.left = '';
      const icon = handle.querySelector('i');
      if (icon) {
        (icon as HTMLElement).style.transform = '';
      }
    }

    if (backdrop) {
      backdrop.style.opacity = '';
    }
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
      document.getElementsByTagName("html")[0].style.overflow = 'auto';
    }, 200);
  }

  onQuickSearchInput(event: any) {
    this.quickSearchQuery = (event?.target as HTMLInputElement)?.value || '';
    this.quickSearchDebounce$.next(this.quickSearchQuery);
  }

  clearQuickSearch() {
    this.quickSearchQuery = '';
    this.quickSearchResults = {recipes: [], ingredients: [], collections: [], users: []};
    this.quickSearchActive = false;
    document.getElementsByTagName("html")[0].style.overflow = 'auto';
  }

  goToExplore() {
    this.navigateTo('explore');
    this.quickSearchActive = false;
    this.quickSearchQuery = '';
    document.getElementsByTagName("html")[0].style.overflow = 'auto';
  }

  showCollection(collection: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showCollectionView = true;
    this.selectedCollection = collection;
    this.quickSearchActive = false;
    this.quickSearchQuery = '';
    document.getElementsByTagName("html")[0].style.overflow = 'auto';
  }

  closeCollectionView(): void {
    this.showCollectionView = false;
    this.selectedCollection = undefined;
  }


  logoClicked(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.isLogoClicked) {
      document.getElementsByTagName("html")[0].style.overflow = 'auto';

      this.quickSearchActive = false;
      this.quickSearchQuery = '';
      this.quickSearchResults = {recipes: [], ingredients: [], collections: [], users: []};

      document.body.scrollTo({top: 0, behavior: 'smooth'});

      this.isLogoClicked = true;
      setTimeout(() => {
        const anims = document.querySelectorAll('animateMotion');
        anims.forEach(anim => {
          if (typeof (anim as any).beginElement === 'function') {
            (anim as any).beginElement();
          }
        });
      }, 0);
      
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
      this.quickSearchActive = false;
      this.quickSearchQuery = '';
      document.getElementsByTagName("html")[0].style.overflow = 'auto';
    }
    let currentNavButton = (event?.target as HTMLElement)?.closest('.nav-item') as HTMLElement;
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
      this.syncLanguageUi();
      this.closeLangDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const navbar = document.getElementById('navbar');
    const isInsideNavbar = navbar && navbar.contains(target);
    const isInsideDragHandle = target.closest('.nav-drag-handle');
    const isInsideQuickSearch = target.closest('.quick-search-wrapper') || target.closest('.quick-search-dropdown');

    if (this.responsive && isInsideNavbar && !this.isDragging && !isInsideQuickSearch) {
      const isClickOnButton = target.closest('button') || target.closest('a') || target.closest('.nav-item') || target.closest('.dropdown-container') || target.closest('input');

      if (!isClickOnButton && !this.navExpanded) {
        this.navExpanded = true;
        return;
      }
    }

    if (this.responsive && this.navExpanded && !isInsideNavbar && !isInsideDragHandle && !this.isDragging && !isInsideQuickSearch) {
      this.closeNav();
    }

    const notifContainer = document.getElementById('notifDropdown');
    if (this.notifDropdownOpen && notifContainer && !notifContainer.contains(target)) {
      this.closeNotifDropdown();
    }

    // Close all dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('.dropdown-container');
    dropdowns.forEach(container => {
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (!container.contains(event.target as Node) || (event.target as HTMLElement).closest('#dropdownMenu')) {
        if (container.id === 'notifDropdown') {
          this.closeNotifDropdown();
          return;
        }

        checkbox.checked = false;
        if (container.id === 'dropdownLangCheckbox') {
          this.closeLangDropdown();
          this.rotateLang = false;
        }
      }
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent) {
    if (this.isHandlePressed) {
      if (Math.abs(event.clientX - this.startX) > 5) {
        event.preventDefault();
      }
      this.onHandleTouchMove(event);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent) {
    if (this.isHandlePressed) {
      this.onHandleTouchEnd(event);
    }
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

  toggleNotifDropdown(event: Event) {
    event.stopPropagation();
    this.notifDropdownOpen = !this.notifDropdownOpen;
    const checkbox = document.getElementById('notifCheckbox') as HTMLInputElement;
    if (checkbox) checkbox.checked = this.notifDropdownOpen;

    if (this.notifDropdownOpen) {
      setTimeout(() => {
        const menu = document.getElementById('notifDropdownMenu') as HTMLElement | null;
        menu?.focus();
      }, 0);
    }
  }

  closeNotifDropdown() {
    this.notifDropdownOpen = false;
    const checkbox = document.getElementById('notifCheckbox') as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
  }

  onNotifFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    const notifContainer = document.getElementById('notifDropdown');
    if (this.notifDropdownOpen && notifContainer && (!next || !notifContainer.contains(next))) {
      this.closeNotifDropdown();
    }
  }

  markNotifAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    if (!notification.read && notification.id) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  onNotificationInlineLinkClick(notification: Notification, event: Event) {
    this.markNotifAsRead(notification, event);
    this.closeNotifDropdown();
  }

  markAllNotifsAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
  }

  handleNotifClick(notification: Notification, event: Event) {
    this.markNotifAsRead(notification, event);
    if (notification.relatedId) {
      if (notification.type === 'REPORTED_RECIPE' || notification.type === 'LIKED_RECIPE' || notification.type === 'ADDED_TO_COLLECTION' || notification.type === 'REVIEW_ADDED') {
        this.router.navigate(['/recipes', notification.relatedId]);
      } else if (notification.type === 'REPORTED_USER') {
        this.router.navigate(['/users', notification.recipientUsername]);
      }
    }
    this.closeNotifDropdown();
  }
}
