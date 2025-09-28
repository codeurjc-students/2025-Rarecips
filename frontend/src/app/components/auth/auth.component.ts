import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupForm {
  firstName: string;
  lastName: string;
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
export class AuthComponent implements AfterViewInit {
  activeTab: 'login' | 'signup' = 'login';
  
  // Password visibility toggles
  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;
  
  // Form data
  loginForm: LoginForm = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  signupForm: SignupForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };
  
  // Loading states
  isLoading = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { 
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {});
  }

  ngAfterViewInit(): void {
    this.randomizeCardPositions();
  }
  
  /**
   * Switch between login and signup tabs
   */
  switchTab(tab: 'login' | 'signup'): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
    this.resetForms();
  }
  
  /**
   * Handle login form submission
   */
  onLogin(): void {
    if (this.validateLoginForm()) {
      this.isLoading = true;
      setTimeout(() => {
        console.log('Login attempt:', this.loginForm);
        this.isLoading = false;
        alert('¡Inicio de sesión exitoso!');
      }, 2000);
    }
  }
  
  /**
   * Handle registration form submission
   */
  onSignup(): void {
    if (this.validateSignupForm()) {
      this.isLoading = true;
      setTimeout(() => {
        console.log('Registration attempt:', this.signupForm);
        this.isLoading = false;
        alert('¡Registro exitoso! Bienvenido a Rarecips.');
        this.switchTab('login');
      }, 2000);
    }
  }
  
  /**
   * Validate forms
   */
  private validateLoginForm(): boolean {
    if (!this.loginForm.email || !this.loginForm.password) {
      alert('Por favor, completa todos los campos requeridos.');
      return false;
    }
    return true;
  }
  
  private validateSignupForm(): boolean {
    const { firstName, lastName, email, password, confirmPassword, acceptTerms } = this.signupForm;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      alert('Por favor, completa todos los campos requeridos.');
      return false;
    }
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return false;
    }
    
    if (!acceptTerms) {
      alert('Debes aceptar los términos y condiciones.');
      return false;
    }
    
    return true;
  }
  
  /**
   * Reset all forms
   */
  private resetForms(): void {
    this.loginForm = { email: '', password: '', rememberMe: false };
    this.signupForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false };
    this.showLoginPassword = false;
    this.showSignupPassword = false;
    this.showConfirmPassword = false;
  }

  /**
   * Smart positioning for floating cards
   */
  private randomizeCardPositions(): void {
    setTimeout(() => {
      const cards = document.querySelectorAll('.preview-card');
      const container = document.querySelector('.floating-preview-cards') as HTMLElement;
      
      if (!container || cards.length === 0) return;
      
      const containerRect = container.getBoundingClientRect();
      const positions: Array<{x: number, y: number}> = [];
      const cardWidth = 150;
      const cardHeight = 120;
      const minDistance = 80;
      
      cards.forEach((card, index) => {
        let attempts = 0;
        let validPosition = false;
        let newPos: {x: number, y: number};
        
        while (!validPosition && attempts < 50) {
          const margin = 40;
          newPos = {
            x: margin + Math.random() * (containerRect.width - cardWidth - margin),
            y: margin + Math.random() * (containerRect.height - cardHeight - margin)
          };
          
          validPosition = positions.every(pos => {
            const distance = Math.sqrt(Math.pow(newPos.x - pos.x, 2) + Math.pow(newPos.y - pos.y, 2));
            return distance >= minDistance;
          });
          attempts++;
        }
        
        if (!validPosition) {
          const cols = 3;
          const row = Math.floor(index / cols);
          const col = index % cols;
          newPos = {
            x: (containerRect.width / cols) * col + (containerRect.width / cols / 2) - cardWidth/2,
            y: (containerRect.height / 2) * row + (containerRect.height / 4) - cardHeight/2
          };
        }
        
        positions.push(newPos!);
        
        const cardElement = card as HTMLElement;
        cardElement.style.left = (newPos!.x / containerRect.width) * 100 + '%';
        cardElement.style.top = (newPos!.y / containerRect.height) * 100 + '%';
        cardElement.style.transform = `rotate(${(Math.random() - 0.5) * 6}deg)`;
        cardElement.style.animationDelay = (Math.random() * 3) + 's';
        
        setTimeout(() => {
          cardElement.classList.add('positioned');
        }, 50 + (index * 100));
      });
    }, 100);
  }
  
  onForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
    console.log('Forgot password clicked');
    alert('Funcionalidad de recuperación de contraseña no implementada aún');
  }
}
