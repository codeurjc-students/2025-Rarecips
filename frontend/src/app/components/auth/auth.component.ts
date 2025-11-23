import {Component, AfterViewInit, OnInit, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {filter, map, take, debounceTime, distinctUntilChanged, switchMap, catchError} from 'rxjs/operators';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, Subject, Subscription, of} from 'rxjs';
import {SessionService} from '../../services/session.service';
import {UserService} from '../../services/user.service';
import {UsernameValidationService} from '../../services/username-validation.service';

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
  imports: [FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
  activeTab: 'login' | 'signup' = 'login';

  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;

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
  private emailArray: string[] = [];
  private usernameArrayLoaded = false;

  private passwordMatch: boolean = false;
  private passwordStrong: boolean = false;

  private usernameInput$ = new Subject<string>();
  private usernameStatus: HTMLCollectionOf<HTMLElement> | null = null;
  private usernameInput: HTMLInputElement | null = null;

  private user: any = null;

  private usernameSub: Subscription | null = null;
  isUsernameAvailable: boolean | null = null;

  API_URL = "/api/v1/auth";

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private sessionService: SessionService,
    private userService: UserService,
    private usernameValidationService: UsernameValidationService
  ) {
    this.switchTab(this.activatedRoute.snapshot.routeConfig?.path === 'signup' ? 'signup' : 'login');
  }

  ngOnInit(): void {
    this.restoreCardPositions();

    // Redirect to home if already logged in
    this.sessionService.getLoggedUser().pipe(take(1)).subscribe(user => {
      if (user) {
        this.router.navigate(['/']);
      }
    });

    this.usernameInput = document.getElementById('signup-username') as HTMLInputElement | null;
    this.usernameStatus = document.getElementsByClassName('username-status') as HTMLCollectionOf<HTMLElement> | null;

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
      this.sessionService.getUsernameList().pipe(
        take(1)
      ).subscribe(list => {
        this.usernameArray = this.usernameArray.concat(list || []);
        this.usernameArrayLoaded = true;
      });

      if (this.usernameStatus && this.usernameStatus[0]) this.usernameStatus[0].style.display = 'block';
      const value = (event.target as HTMLInputElement).value;
      this.usernameInput$.next(value);
    });

  }

  ngAfterViewInit(): void {
    if (AuthComponent.cardsRandomized) {
      this.restoreCardPositions();
      return;
    }

    const isAuthUrl = (url: string) => url.includes('/login') || url.includes('/signup');

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
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
    this.resetForms();
  }

  onLogin(): void {
    if (this.validateLoginForm()) {
      this.isLoading = true;

      const loginBut = document.getElementById('loginBut') as HTMLButtonElement;
      const loginIcon = loginBut.querySelector('i') as HTMLElement;
      const buttontext = loginBut.innerHTML;
      loginBut.innerHTML = "";


      const spinner = document.createElement('img');
      spinner.src = '/assets/icons/Rarecips_Spinner.svg';
      spinner.style.width = '28px';
      spinner.style.height = '28px';
      loginBut.appendChild(spinner);

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
          loginBut.innerHTML = buttontext;
        }
      });
    }
  }

  onSignup(): void {
    if (!this.validateSignupForm()) {
      return;
    }

    // Validate email asynchronously before signup
    this.checkEmailExists(this.signupForm.email).pipe(take(1)).subscribe(exists => {
      if (exists) {
        const emailInput = document.getElementById('signup-email') as HTMLInputElement;
        const emailErrorMsg = document.querySelector('.emailErrorMsg') as HTMLElement;
        emailErrorMsg.innerText = 'Email is already registered.';
        emailErrorMsg.classList.remove('hidden');
        emailInput.style.borderColor = 'red';
        emailInput.style.background = 'rgba(255, 0, 0, 0.1)';

        emailInput.onkeydown = () => {
          emailErrorMsg.classList.add('hidden');
          emailInput.style.borderColor = '';
          emailInput.style.background = '';
        }
        return;
      }

      this.isLoading = true;

      // API Call
      this.sessionService.signup({
        username: this.signupForm.username,
        email: this.signupForm.email,
        password: this.signupForm.password
      }).pipe(take(1)).subscribe({
        next: () => {
          this.isLoading = false;
          setTimeout(() => {
            this.isLoading = false;
            alert("Registration successful, welcome to Rarecips! You can now log in.");
            this.switchTab('login');
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          alert('Registration failed: ' + error.message);
        }
      });
    });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.sessionService.getEmailList().pipe(
      take(1),
      map(list => (list || []).includes(email))
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
          newPos = {
            x: margin + Math.random() * Math.max(0, containerRect.width - cardWidth - margin),
            y: margin + Math.random() * Math.max(0, containerRect.height - cardHeight - margin)
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


        out.push({left: leftPerc, top: topPerc, rotate});
      });

      sessionStorage.setItem(storageKey, JSON.stringify(out));
    }, 100);
  }

  onForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
  }

  onUsernameInput(value: string) {
    this.signupForm.username = value;
    this.usernameInput$.next(value);
  }

  onPasswordInput(value: string) {
    this.onConfirmPasswordInput(this.signupForm.confirmPassword);
    this.signupForm.password = value;
    this.evaluatePassword(value || '');
  }

  onConfirmPasswordInput(value: string) {
    const passwordStatus = document.getElementsByClassName('password-status') as HTMLCollectionOf<HTMLElement>;
    const signupPasswordInput = document.getElementById('signup-password') as HTMLInputElement;
    const signupConfirmPasswordInput = document.getElementById('signup-confirm-password') as HTMLInputElement;
    if (value !== this.signupForm.password) {
      passwordStatus[0].classList.remove('hidden');
      signupConfirmPasswordInput.style.borderColor = 'red';
      signupConfirmPasswordInput.style.background = 'rgba(255, 0, 0, 0.1)';
      signupPasswordInput.style.borderColor = 'red';
      signupPasswordInput.style.background = 'rgba(255, 0, 0, 0.1)';
      this.passwordMatch = false;
    } else {
      passwordStatus[0].classList.add('hidden');
      signupConfirmPasswordInput.style.borderColor = '';
      signupConfirmPasswordInput.style.background = '';
      signupPasswordInput.style.borderColor = '';
      signupPasswordInput.style.background = '';
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
      this.strengthColor = '#ef4444'; // red
    } else if (score === 3) {
      this.strengthLabel = 'Fair';
      this.strengthColor = '#fb923c'; // orange
    } else if (score === 4) {
      this.strengthLabel = 'Good';
      this.strengthColor = '#f59e0b'; // amber
    } else {
      this.strengthLabel = 'Strong';
      this.strengthColor = '#10b981'; // green
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

  ngOnDestroy(): void {
    if (this.usernameSub) {
      this.usernameSub.unsubscribe();
      this.usernameSub = null;
    }
  }
}
