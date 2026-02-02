import {ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet, RoutesRecognized} from '@angular/router';
import {Location} from '@angular/common';
import {filter} from 'rxjs';
import {Component, ElementRef, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {NavbarComponent} from './components/navbar/navbar.component';
import {ThemeService} from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    NavbarComponent,
    RouterOutlet
  ],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'rarecips';

  showNavbarFooter: boolean = true;
  backButton: boolean = false;

  constructor(private router: Router, private themeService: ThemeService, private elementRef: ElementRef,
              private renderer: Renderer2, private location: Location) {

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof RoutesRecognized)
    ).subscribe((event) => {
      // Check if the current route is the login or signup route
      this.showNavbarFooter = !(event.url.includes('/login') ||
        event.url.includes('/signup') || event.url.includes('/change-password'));

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

  tr = true;
  private tilesContainer: HTMLElement | null = null;
  private animationInterval: any;
  private tiles: HTMLElement[] = [];
  private maxTiles = 150;
  private tileSize = 80;
  private spacing = 90; // 80px tile + 10px gap
  private gridPositions: { x: number, y: number, occupied: boolean }[] = [];
  private cols = 0;
  private rows = 0;
  private themes = [
                            'tangerine-light', 'tangerine-dark',
                            'ocean-light', 'ocean-dark',
                            'forest-light', 'forest-dark',
                            'rose-light', 'rose-dark',
                            'neutral-light', 'neutral-dark'
                          ];

  ngOnInit(): void {
    const currentTheme = localStorage.getItem('selectedTheme');
    if (!currentTheme || !this.themes.includes(currentTheme)) localStorage.setItem("selectedTheme", 'tangerine-light');
    this.themeService.changeTheme(localStorage.getItem('selectedTheme') as any);
    this.themeService.setFavicon(`Iconotipo_${localStorage.getItem('selectedTheme')}` || 'Iconotipo_tangerine-light');


    this.initializeTiledBackground();
    this.startTileAnimation();

    // Update background on window resize
    window.addEventListener('resize', () => {
      this.initializeGrid();
    });

    // Update tile positions on scroll to simulate wall movement
    window.addEventListener('scroll', () => {
      this.updateTilePositions();
    });
  }

  ngOnDestroy(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    this.clearAllTiles();

    // Remove listeners
    window.removeEventListener('resize', () => {
      this.initializeGrid();
    });
    window.removeEventListener('scroll', () => {
      this.updateTilePositions();
    });
  }

  private initializeTiledBackground(): void {
    // Find the tiled-background element
    this.tilesContainer = this.elementRef.nativeElement.querySelector('.tiled-background');

    if (this.tilesContainer) {
      // Initialize grid without forcing height
      this.initializeGrid();
      // Create initial tiles
      this.createInitialTiles();
    }
  }

  private initializeGrid(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Use a reasonable multiplier to cover potential scroll without forcing it
    const coverageHeight = viewportHeight * 2;

    this.cols = Math.ceil(viewportWidth / this.spacing);
    this.rows = Math.ceil(coverageHeight / this.spacing);

    // Initialize grid positions
    this.gridPositions = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.gridPositions.push({
          x: col * this.spacing,
          y: row * this.spacing,
          occupied: false
        });
      }
    }
  }

  private updateTilePositions(): void {
    if (!this.tilesContainer) return;

    const scrollY = window.scrollY;

    // Update all tile positions to simulate wall movement
    this.tiles.forEach(tile => {
      const originalY = parseFloat(tile.dataset['originalY'] || '0');

      // Calculate new position based on scroll offset
      const newY = originalY - scrollY * 0.3; // Slower parallax effect

      this.renderer.setStyle(tile, 'top', `${newY}px`);
    });
  }

  private createInitialTiles(): void {
    if (!this.tilesContainer) return;

    // Create reasonable number of initial tiles for natural page height
    const numberOfInitialTiles = Math.min(80, this.gridPositions.length);
    const shuffledPositions = [...this.gridPositions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numberOfInitialTiles; i++) {
      const position = shuffledPositions[i];
      if (!position.occupied) {
        const tile = this.createTileAtPosition(position);
        position.occupied = true;

        // Show some tiles immediately
        if (Math.random() > 0.5) {
          this.renderer.addClass(tile, 'visible');
        }
      }
    }
  }

  private createTileAtPosition(position: { x: number, y: number, occupied: boolean }): HTMLElement {
    if (!this.tilesContainer) return document.createElement('div');

    const tile = this.renderer.createElement('div');
    this.renderer.addClass(tile, 'kitchen-tile');

    // Set grid position
    this.renderer.setStyle(tile, 'left', `${position.x}px`);
    this.renderer.setStyle(tile, 'top', `${position.y}px`);

    // Store original positions for scroll calculations
    tile.dataset['originalX'] = position.x.toString();
    tile.dataset['originalY'] = position.y.toString();

    // Append to container
    this.renderer.appendChild(this.tilesContainer, tile);
    this.tiles.push(tile);

    return tile;
  }

  private createTile(x: number, y: number): HTMLElement {
    if (!this.tilesContainer) return document.createElement('div');

    const tile = this.renderer.createElement('div');
    this.renderer.addClass(tile, 'kitchen-tile');

    // Set position
    this.renderer.setStyle(tile, 'left', `${x}px`);
    this.renderer.setStyle(tile, 'top', `${y}px`);

    // Store original positions for scroll calculations
    tile.dataset['originalX'] = x.toString();
    tile.dataset['originalY'] = y.toString();

    // Append to container
    this.renderer.appendChild(this.tilesContainer, tile);
    this.tiles.push(tile);

    return tile;
  }

  private startTileAnimation(): void {
    this.animationInterval = setInterval(() => {
      this.animateTiles();
    }, 800);
  }

  private animateTiles(): void {
    if (!this.tilesContainer || this.gridPositions.length === 0) return;

    // Randomly show/hide existing tiles less frequently
    this.tiles.forEach(tile => {
      if (Math.random() > 0.85) { // Reduced frequency from 0.6 to 0.85
        if (tile.classList.contains('visible')) {
          this.renderer.removeClass(tile, 'visible');
          this.renderer.removeClass(tile, 'glowing');
          // Mark position as available
          this.markPositionAvailable(tile);
        } else {
          this.renderer.addClass(tile, 'visible');
          // Occasionally add glow effect
          if (Math.random() > 0.98) {
            this.renderer.addClass(tile, 'glowing');
          }
        }
      }
    });

    // Create new tiles less frequently
    if (Math.random() > 0.7 && this.tiles.length < this.maxTiles) { // Reduced from 0.2 to 0.7
      const availablePositions = this.gridPositions.filter(pos => !pos.occupied);
      if (availablePositions.length > 0) {
        const randomPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        const newTile = this.createTileAtPosition(randomPosition);
        randomPosition.occupied = true;

        // Show the new tile after a longer delay
        setTimeout(() => {
          this.renderer.addClass(newTile, 'visible');
        }, 200);
      }
    }

    // Clean up tiles less frequently
    if (Math.random() > 0.95) {
      this.cleanupOldTiles();
    }
  }

  private markPositionAvailable(tile: HTMLElement): void {
    const originalX = parseInt(tile.dataset['originalX'] || '0');
    const originalY = parseInt(tile.dataset['originalY'] || '0');

    const position = this.gridPositions.find(pos =>
      Math.abs(pos.x - originalX) < 5 && Math.abs(pos.y - originalY) < 5
    );

    if (position) {
      position.occupied = false;
    }
  }

  private cleanupOldTiles(): void {
    const invisibleTiles = this.tiles.filter(tile => !tile.classList.contains('visible'));

    if (invisibleTiles.length > 25) { // Increased threshold for larger number of tiles
      const tilesToRemove = invisibleTiles.slice(0, 12);
      tilesToRemove.forEach(tile => {
        // Mark position as available before removing
        this.markPositionAvailable(tile);

        this.renderer.removeChild(this.tilesContainer, tile);
        const index = this.tiles.indexOf(tile);
        if (index > -1) {
          this.tiles.splice(index, 1);
        }
      });
    }
  }

  private clearAllTiles(): void {
    this.tiles.forEach(tile => {
      if (this.tilesContainer && tile.parentNode === this.tilesContainer) {
        this.renderer.removeChild(this.tilesContainer, tile);
      }
    });
    this.tiles = [];

    // Reset all positions as available
    this.gridPositions.forEach(pos => pos.occupied = false);
  }

  goBack(): void {
    this.location.back();
  }

  goForward(): void {
    this.location.forward();
  }

}
