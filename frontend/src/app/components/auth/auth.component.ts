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
  
  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;
  
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
  
  isLoading = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { 
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {});
  }
  
  switchTab(tab: 'login' | 'signup'): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
    this.resetForms();
  }
  
  onLogin(): void {
    if (this.validateLoginForm()) {
      this.isLoading = true;
      // TODO
    }
  }
  
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
  
  private resetForms(): void {
    this.loginForm = { email: '', password: '', rememberMe: false };
    this.signupForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false };
    this.showLoginPassword = false;
    this.showSignupPassword = false;
    this.showConfirmPassword = false;
  }
  
  onForgotPassword(event?: Event): void {
    if (event) event.preventDefault();
    console.log('Forgot password clicked');
    alert('Funcionalidad de recuperación de contraseña no implementada aún');
  }
}
