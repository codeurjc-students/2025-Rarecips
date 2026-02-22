import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {NavigationEnd, Router, RoutesRecognized} from '@angular/router';
import {filter} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  protected title = 'rarecips';
  showNavbarFooter: boolean = true;
  backButton: boolean = false;

  constructor(private location: Location, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof RoutesRecognized)
    ).subscribe((event: any) => {
      this.showNavbarFooter = !(event.url.includes('/login') || event.url.includes('/signup') || event.url.includes('/change-password'));

      this.backButton = (event.url === 'home' ||
          event.url.includes('/users') ||
          event.url.includes('/me') ||
          event.url.includes('/search') ||
          event.url.includes('/recipes') ||
          event.url.includes('/ingredients') ||
          event.url.includes('/admin') ||
          event.url.includes('/health') ||
          event.url.includes('/admin')) ||
        event.url.includes('/explore');
    });
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }
}
