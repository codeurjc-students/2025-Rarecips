import {Component, AfterViewInit, OnInit, OnDestroy, HostListener} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {filter, map, take, debounceTime, distinctUntilChanged, switchMap, catchError} from 'rxjs/operators';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, Subject, Subscription, of} from 'rxjs';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {UsernameValidationService} from '../../services/username-validation.service';
import {NgClass, Location, NgIf} from '@angular/common';
import {ChangePasswordModalComponent} from '../shared/change-password-modal/change-password-modal.component';
import { TranslatorService } from '../../services/translator.service';
import {ThemeService} from '../../services/theme.service';
import {Title} from '@angular/platform-browser';

interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, NgClass, ChangePasswordModalComponent, NgIf],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
  activeTab: 'login' | 'signup' = 'login';

  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;

  showChangePasswordModal = false;
  recoveryToken: string = '';
  changePasswordError: string = '';
  changePasswordSuccess: string = '';
  changePasswordLoading: boolean = false;
  showPasswordRequirements = false;
  strengthScore = 0;
  strengthLabel = '';
  strengthColor = '';
  strengthPercent = 0;
  strengthCriteria: { length: boolean; lower: boolean; upper: boolean; number: boolean; special: boolean } = {
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false
  };
  passwordMatch: boolean = false;
  passwordStrong: boolean = false;
  changePasswordNew: string = '';
  changePasswordConfirm: string = '';
  showPasswordStatus = false;
  showNewPassword = false;
  showConfirmPasswordChange = false;

  readonly localStorage = localStorage;
  responsive: boolean = window.innerWidth <= 1024;

  loginForm: LoginForm = {
    username: '',
    password: '',
    rememberMe: false
  };

  signupForm: SignupForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };

  isLoading = false;
  private static cardsRandomized = false;

  private usernameArray: string[] = ["me"];
  private usernameArrayLoaded = false;

  private usernameInput$ = new Subject<string>();
  private usernameStatus: HTMLCollectionOf<HTMLElement> | null = null;
  private usernameInput: HTMLInputElement | null = null;

  private user: any = null;

  private usernameSub: Subscription | null = null;
  isUsernameAvailable: boolean | null = null;

  showSuccessBanner: boolean = false;
  successBannerMessage: string = '';
  successBannerTimeout: any = null;
  successBannerProgress: number = 100;
  successBannerDuration: number = 4000;
  bannerAnimatingOut: boolean = false;

  showForgotPasswordModal = false;
  forgotEmail = '';
  forgotPasswordError = '';
  forgotPasswordSuccess = '';
  logos: Map<string, string> = new Map();
  loginLoad: boolean = false;
  signupLoad: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private http: HttpClient,
    private themeService: ThemeService,
    private sessionService: SessionService,
    private userService: UserService,
    private usernameValidationService: UsernameValidationService,
    public translator: TranslatorService,
    private titleService: Title
  ) {
    setTimeout(() => {
      this.restoreCardPositions();
    }, 1000);
    this.switchTab(this.activatedRoute.snapshot.routeConfig?.path === 'signup' ? 'signup' : 'login');
    this.translator.onChange(() => {
      this.updateTitle();
    });
  }

  updateTitle() {
    if (this.activeTab === 'login') {
      this.titleService.setTitle(this.t('title_login'));
    } else {
      this.titleService.setTitle(this.t('title_signup'));
    }
  }

  async ngOnInit(): Promise<void> {
    this.logos = this.themeService.getLogos();

    await this.translator.loadTranslations(localStorage.getItem('lang') || 'es');
    if (this.activatedRoute.snapshot.queryParams['token']) {
      this.recoveryToken = this.activatedRoute.snapshot.queryParams['token'];
      this.showChangePasswordModal = true;
    }

    this.restoreCardPositions();

    // Redirect to home if already logged in
    this.sessionService.getLoggedUser().pipe(take(1)).subscribe(user => {
      if (user && (this.activatedRoute.snapshot.routeConfig?.path === 'login' || this.activatedRoute.snapshot.routeConfig?.path === 'signup')) {
        this.router.navigate(['/']);
      }
    });

    this.usernameInput = document.getElementById('signup-username') as HTMLInputElement | null;
    this.usernameStatus = document.getElementsByClassName('username-status') as HTMLCollectionOf<HTMLElement> | null;

    this.sessionService.getUsernameList().pipe(
      take(1)
    ).subscribe(list => {
      this.usernameArray = this.usernameArray.concat(list || []);
      this.usernameArrayLoaded = true;
    });

    this.usernameSub = this.usernameInput$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      map(s => (s && s.trim().length ? s.trim() : null)),
      switchMap((username: string | null) => {
        if (!username) {
          this.isUsernameAvailable = null;
          return of(null);
        }

        if (this.usernameStatus && this.usernameStatus[0]) this.usernameStatus[0].style.display = 'block';

        if (!this.usernameArrayLoaded) {
          return of(null);
        }

        const found = this.usernameArray.includes(username);
        return of({available: !found});
      })
    ).subscribe((res) => {
      if (res === null) {
        this.isUsernameAvailable = null;
        this.usernameValidationService.updateUsernameStyles(this.usernameInput, null);
      } else {
        this.isUsernameAvailable = !!res.available;
        this.usernameValidationService.updateUsernameStyles(this.usernameInput, this.isUsernameAvailable);
      }
    });

    this.usernameInput?.addEventListener('input', (event) => {
      // Check username and email availability ON EACH INPUT CHANGE

      if (this.usernameStatus && this.usernameStatus[0]) this.usernameStatus[0].style.display = 'block';
      const value = (event.target as HTMLInputElement).value;
      this.usernameInput$.next(value);
    });

    const rememberPref = localStorage.getItem('rememberMe');
    this.loginForm.rememberMe = rememberPref === 'true';
  }

  ngAfterViewInit(): void {
    if (AuthComponent.cardsRandomized) {
      this.randomizeCardPositions();
      return;
    }

    const isAuthUrl = (url: string) => url.includes('/login') || url.includes('/signup') || url.includes('change-password');

    if (isAuthUrl(this.router.url)) {
      this.randomizeCardPositions();
      AuthComponent.cardsRandomized = true;
      return;
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      take(1)
    ).subscribe((e: NavigationEnd) => {
      const url = (e as any).urlAfterRedirects || (e as any).url;
      if (isAuthUrl(url)) {
        this.randomizeCardPositions();
        AuthComponent.cardsRandomized = true;
      }
    });
  }

  switchTab(tab: 'login' | 'signup'): void {
    if (this.activeTab === tab) return;
    if (this.activeTab === 'signup' && tab === 'login') {
      document.getElementsByClassName('username-status')[0].setAttribute('style', 'display: none;');
      this.strengthColor = '';
      this.strengthLabel = '';
      this.strengthScore = 0;
      this.strengthPercent = 0;
      this.isUsernameAvailable = null;
    }
    this.activeTab = tab;
    let tabElement: HTMLElement | null = null;
    if (tab === 'login') {
      tabElement = document.getElementsByClassName("login-tab")[0] as HTMLElement;
    } else {
      tabElement = document.getElementsByClassName("signup-tab")[0] as HTMLElement;
    }
    if (tabElement) tabElement.click()
    this.location.replaceState(`/` + tab);
    this.resetForms();
    this.updateTitle();
  }

  onLogin(): void {
    if (this.validateLoginForm()) {
      this.isLoading = true;

      const loginBut = document.getElementById('loginBut') as HTMLButtonElement;
      const loginIcon = loginBut.querySelector('i') as HTMLElement;
      const buttontext = loginBut.innerHTML;


      this.loginLoad = true;

      // API Call
      this.sessionService.login({
        username: this.loginForm.username,
        password: this.loginForm.password,
        rememberMe: this.loginForm.rememberMe
      }).pipe(take(1)).subscribe({
        next: () => { // Successful login
          this.isLoading = false;
          setTimeout(() => {
            loginBut.innerHTML = "";
            loginBut.appendChild(loginIcon);
            loginIcon.className = 'ti ti-check text-xl';
            localStorage.setItem('rememberMe', this.loginForm.rememberMe ? 'true' : 'false');
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1200);
          }, 2000);

          // Update last login time
          this.userService.getUserByUsername(this.loginForm.username).subscribe((res) => {
            this.user = res.data;
            this.http.put(`/api/v1/users/${this.loginForm.username}/checkin`, {}).pipe(take(1)).subscribe();
          });
        },
        error: (error) => {
          if (error.message.includes('400')) {
            this.loginLoad = false;

            const usernameInput = document.getElementById('login-username') as HTMLInputElement;
            const passwordInput = document.getElementById('login-password') as HTMLInputElement;

            const credErrorMsg = document.querySelector('.credErrorMsg') as HTMLElement;
            credErrorMsg.innerText = 'Invalid username or password.';
            credErrorMsg.classList.remove('hidden');

            usernameInput.style.borderColor = 'red';
            usernameInput.style.background = 'rgba(255, 0, 0, 0.1)';

            passwordInput.style.borderColor = 'red';
            passwordInput.style.background = 'rgba(255, 0, 0, 0.1)';

            usernameInput.onkeydown = () => {
              credErrorMsg.classList.add('hidden');
              usernameInput.style.borderColor = '';
              usernameInput.style.background = '';
            }

            passwordInput.onkeydown = () => {
              credErrorMsg.classList.add('hidden');
              passwordInput.style.borderColor = '';
              passwordInput.style.background = '';
            }
          }
        }
      });
    }
  }

  onSignup(): void {
    if (!this.validateSignupForm()) {
      return;
    }

    this.isLoading = true;

    const signupBut = document.getElementById('signupBut') as HTMLButtonElement;
    const signupIcon = signupBut.querySelector('i') as HTMLElement;

    // Validate user and email asynchronously before signup

    this.sessionService.getUsernameList().pipe(
      take(1)
    ).subscribe(list => {
      if (list.includes(this.signupForm.username)) {
        const usernameInput = document.getElementById('signup-username') as HTMLInputElement;
        const usernameErrorMsg = document.querySelector('.usernameErrorMsg') as HTMLElement;
        usernameErrorMsg.innerText = this.t('username_already_exists');
        usernameErrorMsg.classList.remove('hidden');
        usernameInput.style.borderColor = 'red';
        usernameInput.style.background = 'rgba(255, 0, 0, 0.1)';

        usernameInput.onkeydown = () => {
          usernameErrorMsg.classList.add('hidden');
          usernameInput.style.borderColor = '';
          usernameInput.style.background = '';
        }
        this.isLoading = false;
        signupBut.innerHTML = "<i class=\"ti ti-user-plus text-xl\" aria-hidden=\"true\"></i>" + this.t('create_account');
        return;
      }
    });

    this.checkEmailExists(this.signupForm.email).pipe(take(1)).subscribe(exists => {
      if (exists) {
        const emailInput = document.getElementById('signup-email') as HTMLInputElement;
        const emailErrorMsg = document.querySelector('.emailErrorMsg') as HTMLElement;
        emailErrorMsg.innerText = this.t('email_already_exists');
        emailErrorMsg.classList.remove('hidden');
        emailInput.style.borderColor = 'red';
        emailInput.style.background = 'rgba(255, 0, 0, 0.1)';

        emailInput.onkeydown = () => {
          emailErrorMsg.classList.add('hidden');
          emailInput.style.borderColor = '';
          emailInput.style.background = '';
        }
        this.isLoading = false;
        signupBut.innerHTML = "<i class=\"ti ti-user-plus text-xl\" aria-hidden=\"true\"></i>" + this.t('create_account');
        return;
      }

      this.isLoading = true;
      this.signupLoad = true;

      // API Call
      this.sessionService.signup({
        username: this.signupForm.username,
        email: this.signupForm.email,
        password: this.signupForm.password,
        preferences: {
          baseUrl: window.location.origin,
          lang: localStorage.getItem("lang") || 'en',
          theme: "theme-" + localStorage.getItem("selectedTheme") || 'tangerine-light'
        }
      }).pipe(take(1)).subscribe({
        next: (data) => {
          this.isLoading = false;
          setTimeout(() => {
            this.usernameArray.push(this.signupForm.username)
            signupBut.innerHTML = "";
            signupBut.appendChild(signupIcon);
            signupIcon.className = 'ti ti-check text-xl';
            setTimeout(() => {
              this.switchTab('login');
              signupBut.innerHTML = "<i class=\"ti ti-user-plus text-xl\" aria-hidden=\"true\"></i>" + this.t('create_account');
              this.signupLoad = false;
              this.showRegistrationBanner(this.t('registration_success_banner'));
            }, 1200);
          }, 800);
        },
        error: (error) => {
          this.isLoading = false;
          this.signupLoad = false;
          signupBut.innerHTML = "";
          alert('Registration failed: ' + error.message);
        }
      });
    });
  }

  showRegistrationBanner(message: string) {
    this.successBannerMessage = message;
    this.showSuccessBanner = true;
    this.successBannerProgress = 100;
    this.bannerAnimatingOut = false;
    let elapsed = 0;
    const interval = 50;
    if (this.successBannerTimeout) clearInterval(this.successBannerTimeout);
    this.successBannerTimeout = setInterval(() => {
      elapsed += interval;
      this.successBannerProgress = 100 - (elapsed / this.successBannerDuration) * 100;
      if (elapsed >= this.successBannerDuration) {
        this.bannerAnimatingOut = true;
        setTimeout(() => {
          this.showSuccessBanner = false;
          this.bannerAnimatingOut = false;
        }, 500);
        clearInterval(this.successBannerTimeout);
      }
    }, interval);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.sessionService.isEmailAvailable(email).pipe(
      map((available: boolean) => available),
      catchError(() => of(false))
    );
  }

  private validateLoginForm(): boolean {
    if (!this.loginForm.username || !this.loginForm.password) {
      return false;
    }
    return true;
  }

  private validateSignupForm(): boolean {
    const {username, email, password, confirmPassword, acceptTerms} = this.signupForm;

    if (!username || !email || !password || !confirmPassword) {
      return false;
    }

    if (password !== confirmPassword) {
      return false;
    }

    if (!acceptTerms) {
      return false;
    }

    return true;
  }

  private resetForms(): void {
    this.loginForm = {username: '', password: '', rememberMe: false};
    this.signupForm = {username: '', email: '', password: '', confirmPassword: '', acceptTerms: false};
    this.showLoginPassword = false;
    this.showSignupPassword = false;
    this.showConfirmPassword = false;
  }

  private restoreCardPositions(): void {
    const saved = sessionStorage.getItem('authCardPositions');
    if (!saved) return;
    const positions = JSON.parse(saved) as Array<{ left: string; top: string; rotate: number }>;
    const cards = document.querySelectorAll('.preview-card');
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      const pos = positions[i];
      if (!pos) return;
      el.style.left = pos.left;
      el.style.top = pos.top;
      el.style.transform = `rotate(${pos.rotate}deg)`;
      el.classList.add('positioned');
    });
  }

  private randomizeCardPositions(): void {
    const storageKey = 'authCardPositions';
    setTimeout(() => {
      const cards = document.querySelectorAll('.preview-card');
      const container = document.querySelector('.floating-preview-cards') as HTMLElement;
      if (!container || cards.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const used: Array<{ x: number; y: number }> = [];
      const out: Array<{ left: string; top: string; rotate: number }> = [];
      const cardWidth = 150;
      const cardHeight = 120;
      const minDistance = 80;

      cards.forEach((card, index) => {
        let attempts = 0;
        let newPos = {x: 0, y: 0};
        let valid = false;
        const margin = 40;

        while (!valid && attempts < 50) {
          const randomX = Math.random()
          const randomY = Math.random()
          const newX = margin + randomX * Math.abs(containerRect.width - cardWidth - margin)
          const newY = margin + randomY * Math.abs(containerRect.height - cardHeight - margin)
          newPos = {
            x: newX,
            y: newY
          };
          valid = used.every(p => Math.hypot(newPos.x - p.x, newPos.y - p.y) >= minDistance);
          attempts++;
        }

        if (!valid) {
          const cols = Math.max(1, Math.ceil(cards.length / 2));
          const row = Math.floor(index / cols);
          const col = index % cols;
          newPos = {
            x: (containerRect.width / cols) * col + (containerRect.width / cols / 2) - cardWidth / 2,
            y: (containerRect.height / 2) * row + (containerRect.height / 4) - cardHeight / 2
          };
        }

        used.push(newPos);

        const leftPerc = ((newPos.x / containerRect.width) * 100).toFixed(4) + '%';
        const topPerc = ((newPos.y / containerRect.height) * 100).toFixed(4) + '%';
        const rotate = (Math.random() - 0.5) * 6;

        const el = card as HTMLElement;
        el.style.left = leftPerc;
        el.style.top = topPerc;
        el.style.transform = `rotate(${rotate}deg)`;
        el.style.animationDelay = (Math.random() * 3) + 's';
        el.classList.add('positioned');

        out.push({left: leftPerc, top: topPerc, rotate});
      });

      sessionStorage.setItem(storageKey, JSON.stringify(out));
    }, 400);
  }

  onForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
    this.forgotEmail = '';
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';
    this.showForgotPasswordModal = true;
  }
  closeForgotPasswordModal(event: Event) {
    ((event.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));

    setTimeout(() => {
      this.showForgotPasswordModal = false;
    }, 200)}
  onForgotPasswordSubmit(event: Event) {
    event.preventDefault();
    this.forgotPasswordError = '';
    this.forgotPasswordSuccess = '';
    if (!this.forgotEmail || !this.validateEmail(this.forgotEmail)) {
      this.forgotPasswordError = 'Enter a valid email address.';
      return;
    }
    this.userService.sendPasswordRecoveryEmail(this.forgotEmail).subscribe({
      next: () => {
        this.forgotPasswordSuccess = 'A recovery link has been sent to your email.';
        setTimeout(() => this.closeForgotPasswordModal(event), 2000);
      },
      error: (err) => {
        console.log(err)
        this.forgotPasswordError = 'Could not send recovery email.';
      }
    });
  }

  onUsernameInput(value: string) {
    this.signupForm.username = value;
    this.usernameInput$.next(value);
  }

  onPasswordInput(value: string) {
    this.changePasswordNew = value;
    this.evaluatePassword(value || '');
    this.onConfirmPasswordInput(this.changePasswordConfirm);
  }

  onConfirmPasswordInput(value: string) {
    this.changePasswordConfirm = value;
    const passwordStatus = document.getElementsByClassName('password-status') as HTMLCollectionOf<HTMLElement>;
    const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    if (value !== this.changePasswordNew) {
      if (passwordStatus[0]) passwordStatus[0].classList.remove('hidden');
      if (confirmPasswordInput) {
        confirmPasswordInput.style.borderColor = 'red';
        confirmPasswordInput.style.background = 'rgba(255, 0, 0, 0.1)';
      }
      if (newPasswordInput) {
        newPasswordInput.style.borderColor = 'red';
        newPasswordInput.style.background = 'rgba(255, 0, 0, 0.1)';
      }
      this.passwordMatch = false;
    } else {
      if (passwordStatus[0]) passwordStatus[0].classList.add('hidden');
      if (confirmPasswordInput) {
        confirmPasswordInput.style.borderColor = '';
        confirmPasswordInput.style.background = '';
      }
      if (newPasswordInput) {
        newPasswordInput.style.borderColor = '';
        newPasswordInput.style.background = '';
      }
      this.passwordMatch = true;
    }
  }

  evaluatePassword(password: string) {
    const criteria = {
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    this.strengthCriteria = criteria;
    const score = Object.values(criteria).filter(Boolean).length;
    this.strengthScore = score;
    this.strengthPercent = Math.round((score / 5) * 100);
    if (score <= 2) {
      this.strengthLabel = 'Weak';
      this.strengthColor = '#ef4444';
    } else if (score === 3) {
      this.strengthLabel = 'Fair';
      this.strengthColor = '#fb923c';
    } else if (score === 4) {
      this.strengthLabel = 'Good';
      this.strengthColor = '#f59e0b';
    } else {
      this.strengthLabel = 'Strong';
      this.strengthColor = '#10b981';
    }
    this.passwordStrong = score >= 4;
  }

  isSignupDisabled(): boolean {
    if (this.isUsernameAvailable !== true) return true;
    if (!this.signupForm.acceptTerms) return true;
    if (!this.signupForm.username || !this.signupForm.password || !this.signupForm.confirmPassword) return true;
    if (!this.validateEmail(this.signupForm.email)) return true;
    if (!this.passwordMatch) return true;
    if (!this.passwordStrong) return true;
    return false;
  }

  isChangePasswordDisabled(): boolean {
    if (!this.changePasswordNew || !this.changePasswordConfirm) return true;
    if (!this.passwordMatch) return true;
    if (!this.passwordStrong) return true;
    return false;
  }

  onChangePasswordSubmit(event: Event) {
    event.preventDefault();
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    let currentPassword = '';
    if (!this.recoveryToken) {
      currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value || '';
      if (!currentPassword) {
        this.changePasswordError = 'You must enter your current password.';
        return;
      }
    }
    const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value || '';
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value || '';
    if (!newPassword || !confirmPassword) {
      this.changePasswordError = 'You must enter the new password and confirmation.';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.changePasswordError = 'Passwords do not match.';
      return;
    }
    if (!this.passwordStrong) {
      this.changePasswordError = 'The new password must have at least 4 requirements';
      return;
    }
    if (!this.recoveryToken && currentPassword === newPassword) {
      this.changePasswordError = 'The new password must be different from the current password.';
      return;
    }
    this.changePasswordLoading = true;
    if (this.recoveryToken) {
      this.userService.changePasswordWithToken(this.recoveryToken, newPassword, confirmPassword).subscribe({
        next: (response: any) => {
          this.changePasswordSuccess = 'Password changed successfully.';
          this.changePasswordError = '';
          this.changePasswordLoading = false;
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 1200);
        },
        error: (error: any) => {
          if (typeof error.error === 'string') error.error = JSON.parse(error.error).error;
          this.changePasswordError = 'Password change failed. Please try again.';
          this.changePasswordSuccess = '';
          this.changePasswordLoading = false;
        }
      });
    } else {
      this.userService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
        next: (response: any) => {
          this.changePasswordSuccess = 'Password changed successfully.';
          this.changePasswordError = '';
          this.changePasswordLoading = false;
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 1200);
        },
        error: (error: any) => {
          if (typeof error.error === 'string') error.error = JSON.parse(error.error).error;
          this.changePasswordError = 'Password change failed. Please try again.';
          this.changePasswordSuccess = '';
          this.changePasswordLoading = false;
        }
      });
    }
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
    this.changePasswordError = '';
    this.changePasswordSuccess = '';
    this.changePasswordLoading = false;
    this.changePasswordNew = '';
    this.changePasswordConfirm = '';
    this.strengthScore = 0;
    this.strengthLabel = '';
    this.strengthColor = '';
    this.strengthPercent = 0;
    this.strengthCriteria = { length: false, lower: false, upper: false, number: false, special: false };
    this.passwordMatch = false;
    this.passwordStrong = false;
    this.showPasswordStatus = false;
    this.showNewPassword = false;
    this.showConfirmPasswordChange = false;
    this.strengthCriteria.length = false;
    this.strengthCriteria.number = false;
    this.strengthCriteria.lower = false;
    this.strengthCriteria.upper = false;
    this.strengthCriteria.special = false;
    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    if (this.usernameSub) {
      this.usernameSub.unsubscribe();
      this.usernameSub = null;
    }
  }

  holdLoginPassword() { this.showLoginPassword = true; }
  releaseLoginPassword() { this.showLoginPassword = false; }
  holdSignupPassword() { this.showSignupPassword = true; }
  releaseSignupPassword() { this.showSignupPassword = false; }
  holdConfirmPassword() { this.showConfirmPassword = true; }
  releaseConfirmPassword() { this.showConfirmPassword = false; }

  t(key: string): string {
    return this.translator.translate(key);
  }
}

