import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  imports: [ FormsModule ]
})
export class ProfileViewComponent {
  @Input() isOwnProfile: boolean = false;

  editing: boolean = false;

  constructor() {}

}
