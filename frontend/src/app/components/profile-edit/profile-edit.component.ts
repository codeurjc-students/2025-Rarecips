import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';
import {UsernameValidationService} from '../../services/username-validation.service';
import {OnInit} from '@angular/core';
import {NgClass, NgIf, NgStyle} from '@angular/common';
import {ChangePasswordModalComponent} from '../shared/change-password-modal/change-password-modal.component';
import {User} from '../../models/user.model';
import { TranslatorService } from '../../services/translator.service';
import {NavbarComponent} from '../navbar/navbar.component';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  imports: [
    NgClass,
    NgStyle,
    ChangePasswordModalComponent,
    NgIf
  ],
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {

  usernamePath: string = '';
  usernameSession: string = '';
  user: any = null;

  isDragging: boolean = false;

  emailInput: HTMLInputElement = null as any;
  displaynameInput: HTMLInputElement = null as any;
  bioInput: HTMLInputElement = null as any;

  isEmailAvailable: boolean = null as any;
  isEmailValid: boolean = null as any;


  deleteHoldActive = false;
  deleteHoldProgress = 0;
  deleteInProgress = false;
  private deleteHoldInterval: any = null;
  private deleteHoldStart: number = 0;

  confirmDeleteMode = false;
  secondDeletionText: string = "Deleting account...";

  showChangePasswordModal = false;

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
  showConfirmPassword = false;

  changePasswordToken: string = '';

  showCurrentPassword: boolean = false;
  isAdmin: boolean = false;
  base64String: string | null = '';
  selectedImageFile: File = null as any;
  defaultPfp: string = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private sessionService: SessionService,
    private usernameValidationService: UsernameValidationService,
    private translatorService: TranslatorService
  ) {
  }

  ngOnInit() {
    this.userService.getDefaultPfp().subscribe({
      next: (data) => this.defaultPfp = data
    });

    this.usernamePath = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.usernameSession = loggedUser?.username;
      this.isAdmin = loggedUser?.role.includes("ADMIN");

      if ((this.usernamePath !== this.usernameSession || !loggedUser) && !this.isAdmin) {
        this.router.navigate(['/error'], {
          state: {
            status: 403,
            reason: "You do not have permission to perform this action."
          }
        });
      }
    });

    this.userService.getUserByUsername(this.usernamePath).subscribe({
      next: (userData) => {
        this.user = userData;
          if (this.user.profileImageString && !this.defaultPfp.includes(this.user.profileImageString)) {
          this.base64String = this.user.profileImageString;
        }
      },
      error: error => {
        this.user = null;
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
      }
    });

    this.secondDeletionText = this.translatorService.translate('deleting_account');

    this.displaynameInput = document.getElementsByClassName("displayNameInput")[0] as HTMLInputElement;
    this.bioInput = document.getElementsByClassName("bioInput")[0] as HTMLInputElement;
    this.emailInput = document.getElementsByClassName("emailInput")[0] as HTMLInputElement;

    this.emailInput.oninput = (ev) => {
      this.isEmailValid = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailInput.value));

      this.usernameValidationService.updateEmailStyles(this.emailInput, this.isEmailValid);

      if (this.emailInput.value === this.user.email) {
        this.isEmailAvailable = null as any;
        this.usernameValidationService.updateEmailStyles(this.emailInput, true);
        this.emailInput.setCustomValidity('');
        return;
      }

      this.sessionService.isEmailAvailable(this.emailInput.value).subscribe(exists => {
        if (exists) {
          this.isEmailAvailable = false;
          this.usernameValidationService.updateEmailStyles(this.emailInput, false);
          this.emailInput.setCustomValidity('Email is already taken.');
        } else if (!exists && this.isEmailValid) {
          this.isEmailAvailable = true;
          this.usernameValidationService.updateEmailStyles(this.emailInput, true);
          this.emailInput.setCustomValidity('');
        }
      })
    }
  }

  loadUserData(): Promise<User> {
    this.userService.getUserByUsername(this.usernamePath).subscribe({
      next: (userData) => {
        this.user = userData;
      },
      error: error => {
        this.user = null;
        this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
      }
    });
    return this.user;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    this.processImageFile(file);
  }

  onSelectImage(event: any): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    this.processImageFile(file);
  }

  private processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      console.error('Selected file is not an image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('Image is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.base64String = e.target.result.split(',')[1];
      // Change image in preview,not yet in backend until changes are confirmed
      this.user.profileImageString = this.base64String;
    };
    reader.readAsDataURL(file);
    this.selectedImageFile = file;

  }

  formValid(): boolean {
    // Basic validation
    return (this.isEmailAvailable == false || !this.emailInput.value || this.isEmailValid == false);
  }

  saveChanges(): void {
    //More conditions in the future
    //if...
    // Prepare updated user data
    this.user.displayName = this.displaynameInput.value;
    this.user.email = this.emailInput.value;
    this.user.bio = this.bioInput.value;
    this.user.privateProfile = !(document.getElementById("publicProfileInput") as HTMLInputElement).checked;

    const userData = {
      username: this.user.username,
      displayName: this.user.displayName,
      bio: this.user.bio,
      email: this.user.email,
      profileImageString: this.base64String,
      privateProfile: this.user.privateProfile
    };

    this.userService.updateUser(this.usernamePath, userData).subscribe({
      next: (response) => {
        this.router.navigate(['/users', this.usernamePath]);
      },
      error: (error) => {
        console.error('Error updating user data:', error);
      }
    });
  }

  activateConfirmDelete() {
    if (!this.confirmDeleteMode && !this.deleteInProgress) {
      this.confirmDeleteMode = true;
      this.deleteHoldActive = false;
      this.deleteHoldProgress = 0;
    }
  }

  startDeleteHold() {
    if (!this.confirmDeleteMode || this.deleteInProgress) return;
    this.deleteHoldActive = true;
    this.deleteHoldProgress = 0;
    this.deleteHoldStart = Date.now();
    const holdTime = 5000;
    this.deleteHoldInterval = setInterval(() => {
      const elapsed = Date.now() - this.deleteHoldStart;
      this.deleteHoldProgress = Math.min(100, (elapsed / holdTime) * 100);
      if (elapsed >= holdTime) {
        clearInterval(this.deleteHoldInterval);
        this.deleteHoldActive = false;
        this.deleteHoldProgress = 100;
        this.deleteInProgress = true;
        this.deleteAccount();
      }
    }, 50);
  }

  cancelDeleteHold() {
    if (this.deleteHoldInterval) {
      clearInterval(this.deleteHoldInterval);
      this.deleteHoldInterval = null;
    }
    if (!this.deleteInProgress) {
      const initialProgress = this.deleteHoldProgress;
      let progress = initialProgress;
      const animationTime = 600;
      const step = 20;
      const decrement = initialProgress / (animationTime / step);
      const interval = setInterval(() => {
        progress -= decrement;
        this.deleteHoldProgress = Math.max(0, progress);
        if (progress <= 0) {
          clearInterval(interval);
          this.deleteHoldProgress = 0;
          setTimeout(() => {
            this.deleteHoldActive = false;
            this.secondDeletionText = this.translatorService.translate('deleting_account');
          }, 400);
        } else {
          this.secondDeletionText = this.translatorService.translate('yay_welcome_back');
        }
      }, step);
    }
  }

  deleteAccount() {
    if (!this.isAdmin) {
      this.sessionService.logout();

      this.userService.deleteCurrentUser().subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.resetDeleteState();
        },
        error: (err) => {
          this.router.navigate(['/error'], {state: {status: err.status, reason: err.statusText}});
          this.resetDeleteState();
        }
      });
    } else {
      this.userService.deleteUserByUsername(this.usernamePath).subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.resetDeleteState();
        },
        error: (err) => {
          this.router.navigate(['/error'], {state: {status: err.message, reason: err.statusText}});
          this.resetDeleteState();
        }
      });
    }
  }

  resetDeleteState() {
    this.confirmDeleteMode = false;
    this.deleteHoldActive = false;
    this.deleteHoldProgress = 0;
    this.deleteInProgress = false;
    if (this.deleteHoldInterval) {
      clearInterval(this.deleteHoldInterval);
      this.deleteHoldInterval = null;
    }
  }

  protected hoverDelete() {
    let userX = document.getElementsByClassName("ti-user-x")[0] as HTMLElement;
    userX.style.transition = "transform 0.1s ease-in-out";
    userX.style.transform = "rotate(-12deg) scale(1.2)";
  }

  protected leaveDelete() {
    let userX = document.getElementsByClassName("ti-user-x")[0] as HTMLElement;
    userX.style.transform = "rotate(0deg) scale(1)";
  }

  openChangePasswordModal(token: string = '') {
    this.showChangePasswordModal = true;
    this.changePasswordToken = token;
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
    this.strengthPercent = 0;
    this.changePasswordSuccess = '';
    this.strengthCriteria.length = false;
    this.strengthCriteria.number = false;
    this.strengthCriteria.lower = false;
    this.strengthCriteria.upper = false;
    this.strengthCriteria.special = false;
    this.strengthLabel = "";
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
    if (!this.changePasswordToken) {
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
    if (!this.changePasswordToken && currentPassword === newPassword) {
      this.changePasswordError = 'The new password must be different from the current password.';
      return;
    }
    this.changePasswordLoading = true;
    if (this.changePasswordToken) {
      this.userService.changePasswordWithToken(this.changePasswordToken, newPassword, confirmPassword).subscribe({
        next: (response: any) => {
          this.changePasswordSuccess = 'Password changed successfully.';
          this.changePasswordError = '';
          this.changePasswordLoading = false;
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 1200);
        },
        error: (error: any) => {
          console.log({error});
          this.changePasswordError = 'Password change failed. Please try again.';
          this.changePasswordSuccess = '';
          this.changePasswordLoading = false;
        }
      });
    } else {
      if (!this.isAdmin) {
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
            console.log({error});
            this.changePasswordError = 'Password change failed. Please try again.';
            this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
            this.changePasswordSuccess = '';
            this.changePasswordLoading = false;
          }
        });
      } else {
        this.userService.changePasswordForUserAsAdmin(this.usernamePath, currentPassword, newPassword, confirmPassword).subscribe({
          next: (response: any) => {
            this.changePasswordSuccess = 'Password changed successfully.';
            this.changePasswordError = '';
            this.changePasswordLoading = false;
            setTimeout(() => {
              this.closeChangePasswordModal();
            }, 1200);
          },
          error: (error: any) => {
            console.log({error});
            this.changePasswordError = 'Password change failed. Please try again.';
            this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
            this.changePasswordSuccess = '';
            this.changePasswordLoading = false;
          }
        });
      }
    }
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  cancelChanges() {
    window.history.back();
  }

  removeImage(): void {
    this.selectedImageFile = null as any;
    this.base64String = '';
  }

  private getDefaultPfp() {
    this.userService.getDefaultPfp()
    return '';
  }
}
