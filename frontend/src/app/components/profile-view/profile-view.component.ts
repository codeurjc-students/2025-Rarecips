import {Component, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  imports: [FormsModule],
})
export class ProfileViewComponent implements OnInit {
  isOwnProfile: boolean = false;

  editing: boolean = false;
  username: string = '';
  user: any = null;
  isAdmin: boolean = false;
  lastOnlineDate: string = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService, private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.username = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.userService.getUserByUsername(this.username).subscribe(userData => {
      this.user = userData;

      //local date for createdAt
      this.user.createdAt = new Date(this.user.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });

      this.lastOnlineDate = this.user.lastOnline;

      // Format last online date to relative strings (like yesterday, 2 days ago, etc.) and capitalize first letter
      const diffMs = Date.now() - new Date(this.lastOnlineDate).getTime();

      // Just now if less than a minute
      if (Math.abs(diffMs) < 60 * 1000) {
        this.user.lastOnline = 'Just now';
      } else {
        const dayDiff = Math.trunc((new Date(this.lastOnlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        this.user.lastOnline = new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(dayDiff, 'day');

        this.user.lastOnline = this.user.lastOnline[0].toUpperCase() + this.user.lastOnline.slice(1);

        this.user.lastOnline += ' at ' + new Date(this.lastOnlineDate).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }, error => {
      this.user = null;
      console.log(error)
      this.router.navigate(['/error'], {state: {status: error.status, reason: error.statusText}});
    });

    this.isAdmin = this.user?.roles?.includes('ADMIN');

    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.isOwnProfile = loggedUser.username === this.username;
    });
  }

  navigateToEditProfile() {
    this.editing = true;
    this.router.navigate([`/users/${this.username}/edit`]);
  }

}
