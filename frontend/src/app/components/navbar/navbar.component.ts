import { Component, HostListener, OnInit, OnDestroy, Host, NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    standalone: true,
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {

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

    logoSrc = "assets/logo/Rarecips_Isotipo.svg";

    currentLanguage = 'es';
    isAuthenticated = false;
    isAdmin = false;

    ngOnDestroy(): void {
        //
    }
    ngOnInit(): void {
        const body = document.querySelector('body');
        const navbar = document.getElementById('navbar');
        const selectedTheme = localStorage.getItem('selectedTheme') || "theme-tangerine-light";
        body?.classList.add(selectedTheme);
        navbar?.classList.add(selectedTheme);
    }

    logoClicked(event: Event): void {
        event.preventDefault(); // Prevent default anchor behavior
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scroll to top
        });
        // Logo change
        this.logoSrc = "assets/logo/Rarecips_Stir.svg";
        setTimeout(() => {
            this.logoSrc = "assets/logo/Rarecips_Isotipo.svg"; // Reset after 1 second
        }, 1000);
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
                console.log(theme);
                theme = "theme-" + theme;
                if (theme === item?.id) return;
                body?.classList.remove(theme);
                navbar?.classList.remove(theme);
            });
            body?.classList.add(item?.id + "");
            navbar?.classList.add(item?.id + "");
        }
    }

    navigateTo(route: string): void {
        // Handle navigation logic
        console.log('Navigating to:', route);
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

    openAuth(): void {
        console.log('Opening authentication dialog');
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


}
