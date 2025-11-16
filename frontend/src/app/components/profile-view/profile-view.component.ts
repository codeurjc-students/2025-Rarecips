import {Component, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  imports: [FormsModule]
})
export class ProfileViewComponent implements OnInit {
  isOwnProfile: boolean = false;

  editing: boolean = false;
  username: string = '';
  user: any = null;
  isAdmin: boolean = false;

  constructor(private activatedRoute: ActivatedRoute, private userService: UserService, private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.username = this.activatedRoute.snapshot.paramMap.get('id') || '';

    this.userService.getUserByUsername(this.username).then(userData => {
      this.user = userData;
    }).catch(error => {
      console.error('Error fetching user data:', error);
    });

    this.isAdmin = this.user?.roles?.includes('ADMIN');

    this.sessionService.getLoggedUser().subscribe(loggedUser => {
      this.isOwnProfile = loggedUser.username === this.username;
    });
  }

}
