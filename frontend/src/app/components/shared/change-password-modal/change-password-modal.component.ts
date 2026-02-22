import { Component, Input, Output, EventEmitter } from '@angular/core';
import {NgClass, CommonModule} from '@angular/common';
import { TranslatorService } from '../../../services/translator.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  templateUrl: './change-password-modal.component.html',
  imports: [
    CommonModule,
    NgClass
  ],
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {
  @Input() show: boolean = false;
  @Input() requireCurrentPassword: boolean = true;
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() success: string = '';
  @Input() showPasswordRequirements: boolean = false;
  @Input() strengthPercent: number = 0;
  @Input() strengthColor: string = '';
  @Input() strengthLabel: string = '';
  @Input() strengthCriteria: any = {};
  @Input() showPasswordStatus: boolean = false;
  @Input() showNewPassword: boolean = false;
  @Input() showConfirmPassword: boolean = false;
  @Input() isChangePasswordDisabled: boolean = false;
  @Input() showCurrentPassword: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<Event>();
  @Output() passwordInput = new EventEmitter<string>();
  @Output() confirmPasswordInput = new EventEmitter<string>();
  @Output() showNewPasswordChange = new EventEmitter<boolean>();
  @Output() showConfirmPasswordChange = new EventEmitter<boolean>();
  @Output() showPasswordRequirementsChange = new EventEmitter<boolean>();
  @Output() showCurrentPasswordChange = new EventEmitter<boolean>();

  constructor(private translatorService: TranslatorService) {}

  onPasswordInput(event: Event) {
    this.passwordInput.emit((event.target as HTMLInputElement).value);
  }
  onConfirmPasswordInput(event: Event) {
    this.confirmPasswordInput.emit((event.target as HTMLInputElement).value);
  }
  onSubmit(event: Event) {
    this.submit.emit(event);
  }

  closeModal(event: Event) {
    ((event.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
    setTimeout(() => this.close.emit(), 200)
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }
}
