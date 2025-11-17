import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';
import {UsernameValidationService} from '../../services/username-validation.service';
import {OnInit} from '@angular/core';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

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

  usernameInput: HTMLInputElement = null as any;
  emailInput: HTMLInputElement = null as any;

  usernameList: string[] = [];
  emailList: string[] = [];

  isUsernameAvailable: boolean = null as any;
  isEmailAvailable: boolean = null as any;

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

    this.usernameInput = document.getElementsByClassName('usernameInput')[0] as HTMLInputElement;
    this.emailInput = document.getElementsByClassName("emailInput")[0] as HTMLInputElement;

    this.usernameInput.oninput = (ev) => {
      if (this.usernameInput.value === this.user.username) {
        this.isUsernameAvailable = null as any;
        this.usernameValidationService.updateUsernameStyles(this.usernameInput, true);
        this.usernameInput.setCustomValidity('');
        return;
      }

      this.sessionService.getUsernameList().subscribe(usernames => {
        this.usernameList = usernames;
        if (this.usernameList.includes(this.usernameInput.value)) {
          this.isUsernameAvailable = false;
          this.usernameValidationService.updateUsernameStyles(this.usernameInput, false);
          this.usernameInput.setCustomValidity('Username is already taken.');
        } else {
          this.isUsernameAvailable = true;
          this.usernameValidationService.updateUsernameStyles(this.usernameInput, true);
          this.usernameInput.setCustomValidity('');
        }
      })
    }

    this.emailInput.oninput = (ev) => {
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
        } else {
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
    return (this.isUsernameAvailable == false || this.isEmailAvailable == false || !this.usernameInput.value || !this.emailInput.value);
  }

  saveChanges(): void {
    console.log(this.formValid());
    //More conditions in the future
    //if...
    // Prepare updated user data
    const userData = {
      username: this.user.username,
      displayName: this.user.displayName,
      bio: this.user.bio,
      email: this.user.email,
      profileImageString: this.user.profileImageString
    };

    this.userService.updateUser(this.user.username, userData).subscribe({
      next: (response) => {
        console.log('User updated successfully', response);
        this.router.navigate(['/users', this.user.username]);
      },
      error: (error) => {
        console.error('Error updating user data:', error);
      }
    });
  }


}
