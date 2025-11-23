import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';
import {UsernameValidationService} from '../../services/username-validation.service';
import {OnInit} from '@angular/core';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
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

  emailList: string[] = [];

  isEmailAvailable: boolean = null as any;
  isEmailValid: boolean = null as any;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private sessionService: SessionService,
    private usernameValidationService: UsernameValidationService
  ) {
  }

  ngOnInit(): void {

    this.usernamePath = this.activatedRoute.snapshot.paramMap.get('id') || '';
    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.usernameSession = loggedUser?.username;

      if (this.usernamePath !== this.usernameSession || !loggedUser) {
        this.router.navigate(['/error'], {
          state: {
            status: 403,
            reason: "You do not have permission to perform this action."
          }
        });
      }

      this.userService.getUserByUsername(this.usernamePath).subscribe(userData => {
        this.user = userData;
      },
        error =>  {
          this.user = null;
          this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
        });
    });

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

      this.sessionService.getEmailList().subscribe(emails => {
        this.emailList = emails;
        if (this.emailList.includes(this.emailInput.value)) {
          this.isEmailAvailable = false;
          this.usernameValidationService.updateEmailStyles(this.emailInput, false);
          this.emailInput.setCustomValidity('Email is already taken.');
        } else if (!this.emailList.includes(this.emailInput.value) && this.isEmailValid) {
          this.isEmailAvailable = true;
          this.usernameValidationService.updateEmailStyles(this.emailInput, true);
          this.emailInput.setCustomValidity('');
        }
      })
    }
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
      const base64String = e.target.result.split(',')[1];
      // Change image in preview,not yet in backend until changes are confirmed
      this.user.profileImageString = base64String;
    };
    reader.readAsDataURL(file);
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

    const userData = {
      username: this.user.username,
      displayName: this.user.displayName,
      bio: this.user.bio,
      email: this.user.email,
      profileImageString: this.user.profileImageString
    };

    this.userService.updateUser(this.usernamePath, userData).subscribe({
      next: (response) => {
        this.router.navigate(['/users', this.usernamePath]).then(() => {
          window.location.reload();
        });
      },
      error: (error) => {
        console.error('Error updating user data:', error);
      }
    });
  }


}
