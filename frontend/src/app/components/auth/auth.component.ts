import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RegisterForm {
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
  activeTab: 'login' | 'register' = 'login';
  
  // Password visibility toggles
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;
  
  // Form data
  loginForm: LoginForm = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  registerForm: RegisterForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };
  
  // Loading states
  isLoading = false;
  
  constructor() { }

  ngAfterViewInit(): void {
    this.randomizeCardPositions();
  }
  
  /**
   * Switch between login and register tabs
   */
  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
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
  onRegister(): void {
    if (this.validateRegisterForm()) {
      this.isLoading = true;
      setTimeout(() => {
        console.log('Registration attempt:', this.registerForm);
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
  
  private validateRegisterForm(): boolean {
    const { firstName, lastName, email, password, confirmPassword, acceptTerms } = this.registerForm;
    
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
    this.registerForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false };
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
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
