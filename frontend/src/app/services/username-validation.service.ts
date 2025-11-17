import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UsernameValidationService {

  updateUsernameStyles(input: HTMLInputElement | null, available: boolean | null): void {
    if (!input) return;

    if (available === null) {
      input.style.background = 'var(--primary-100-40)';
      input.style.borderColor = 'var(--primary-100)';
      return;
    }

    if (available) {
      input.style.background = 'var(--primary-100-40)';
      input.style.borderColor = 'var(--primary-100)';
    } else {
      input.style.background = 'rgba(255, 0, 0, 0.1)';
      input.style.borderColor = 'red';
    }
  }

  updateEmailStyles(input: HTMLInputElement | null, available: boolean | null): void {
    if (!input) return;

    if (available === null) {
      input.style.background = 'var(--primary-100-40)';
      input.style.borderColor = 'var(--primary-100)';
      return;
    }

    if (available) {
      input.style.background = 'var(--primary-100-40)';
      input.style.borderColor = 'var(--primary-100)';
    } else {
      input.style.background = 'rgba(255, 0, 0, 0.1)';
      input.style.borderColor = 'red';
    }
  }
}

