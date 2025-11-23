import {Component, HostListener, OnInit, Host, NgModule} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  themes = [
    "tangerine-light",
    "tangerine-dark",
    "ocean-light",
    "ocean-dark",
    "forest-light",
    "forest-dark",
    "rose-light",
    "rose-dark",
    "neutral-light",
    "neutral-dark"
  ];

  logoSrc = "assets/icons/Rarecips_Isotipo.svg";
  bowlIcon: string = "../../../assets/icons/bowl-spoon.svg";

  currentLanguage = 'es';
  isAuthenticated = false;
  isAdmin = false;
  user: any = null;

  constructor(private router: Router, private sessionService: SessionService) {
  }

  ngOnInit(): void {
    const body = document.querySelector('body');
    const navbar = document.getElementById('navbar');;

    const selectedTheme = localStorage.getItem('selectedTheme') || "theme-tangerine-light";
    body?.classList.add(selectedTheme);
    navbar?.classList.add(selectedTheme);

    this.sessionService.getLoggedUser().pipe(
      takeUntil(new Subject<void>())
    ).subscribe({
      next: user => {
        if (!user) {
          this.isAuthenticated = false;
          this.isAdmin = false;
          return;
        }

        this.isAuthenticated = true;
        this.user = user;
        this.isAdmin = user.role === 'ADMIN';
      },
      error: () => {
        this.isAuthenticated = false;
        this.isAdmin = false;
      }
    });
  }

  logoClicked(event: Event): void {
    event.preventDefault(); // Prevent default anchor behavior
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scroll to top
    });
    // Logo change
    this.logoSrc = "assets/icons/Rarecips_Stir.svg";
    setTimeout(() => {
      this.logoSrc = "assets/icons/Rarecips_Isotipo.svg"; // Reset after 1 second
    }, 1000);
  }

  onHover(isHovering: boolean): void {
    this.bowlIcon = isHovering ? "assets/icons/bowl-spoon-stir.svg" : "assets/icons/bowl-spoon-withdraw.svg";
  }

  openSearchDialog(): void {
    const dialogOverlay = document.getElementById('dialogOverlay');
    if (dialogOverlay) {
      dialogOverlay.classList.add('open');
    }
  }

  currentValue: string = '';
  selectedText: string = 'Select an option';

  selectItem(event: Event): void {
    const dropdown = document.getElementById('dropdownMenu');
    const item = (event.target as HTMLButtonElement).closest('.dropdown-item');

    if (item) {
      localStorage.setItem('selectedTheme', item.id);

      dropdown?.querySelectorAll('.dropdown-item').forEach(el => {
        el.classList.remove("selected");
      });
      item?.classList.add("selected");
      const body = document.querySelector('body');
      const navbar = document.getElementById('navbar');
      this.themes.forEach(theme => {
        theme = "theme-" + theme;
        if (theme === item?.id) return;
        body?.classList.remove(theme);
        navbar?.classList.remove(theme);
      });
      body?.classList.add(item?.id + "");
      navbar?.classList.add(item?.id + "");
    }
  }

  navigateTo(route: string, event?: Event): void {
    if (route === 'profile' && !this.isAuthenticated) {
      route = 'login';
    } else if (route === 'profile' && this.isAuthenticated) {
      this.sessionService.getLoggedUser().pipe(takeUntil(new Subject<void>())).subscribe(user => {
        this.router.navigate([`/users/${user.username}`]);
      });
      return;
    }
    this.router.navigate([`/${route}`]);
    let currentNavButton = (event?.target as HTMLElement).closest('.nav-item') as HTMLElement;
    let navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      if (item.classList.contains('active')) {
        item.classList.remove('active')
        let label = item.children[0] as HTMLElement;
        label.classList.forEach(c => {
          if (c.endsWith('-filled')) {
            label.classList.remove(c);
            label.classList.add(c.replace('-filled', ''));
          }
        });
      }
    });

    if (!currentNavButton) return;
    currentNavButton.classList.add('active');
    let label = currentNavButton.children[0] as HTMLElement;
    label.classList.forEach(c => {
      if (c.startsWith('ti-') && !c.endsWith('-filled')) {
        label.classList.remove(c);
        label.classList.add(c + '-filled');
      }
    });
  }

  selectLanguage(event: Event): void {
    const item = (event.target as HTMLButtonElement).closest('.dropdown-item');
    if (item) {
      const lang = item.getAttribute('data-lang');
      this.currentLanguage = lang || 'es';
      localStorage.setItem('selectedLanguage', this.currentLanguage);
      console.log('Language changed to:', this.currentLanguage);
    }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent): void {
    // Close all dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('.dropdown-container');
    dropdowns.forEach(container => {
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (!container.contains(event.target as Node)) {
        checkbox.checked = false;
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {

    const dropdown = document.getElementById('dropdownMenu');

    if (event.key === 'Escape') {
      dropdown?.classList.remove("open");
    }
  }

  onLogout(): void {
    this.sessionService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']).then(() => {
          window.location.reload();
        })
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Even if there's an error, reload the page to clear the session
        window.location.reload();
      }
    });
  }


}
