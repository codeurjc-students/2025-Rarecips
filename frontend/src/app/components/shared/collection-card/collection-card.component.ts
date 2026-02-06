import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {RecipeCollection} from '../../../models/recipe-collection.model';
import {RecipeCollectionService} from '../../../services/recipe-collection.service';
import {SessionService} from '../../../services/session.service';
import {UserService} from '../../../services/user.service';
import { TranslatorService } from '../../../services/translator.service';

@Component({
  selector: 'app-collection-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collection-card.component.html',
  styleUrls: ['./collection-card.component.css']
})
export class CollectionCardComponent implements OnInit, OnChanges {
  @Input() username?: string;
  @Input() isOwner: boolean = false;
  @Input() mode: 'list' | 'add-dialog' | 'view' = 'list';
  @Input() recipeId?: number;
  @Input() collection?: RecipeCollection;
  @Input() showDialog: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onAdded = new EventEmitter<void>();
  @Output() onView = new EventEmitter<RecipeCollection>();
  @Output() onCreate = new EventEmitter<void>();

  @Input() collections: RecipeCollection[] = [];
  @Input() isAdmin: boolean = false;
  @Input() collectionList: RecipeCollection[] = [];
  loading: boolean = false;
  loadingMore: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  hasMore: boolean = true;
  editingCollectionId: number | null = null;
  editingCollectionTitle: string = '';
  showCreateNew: boolean = false;
  newCollectionTitle: string = '';
  creating: boolean = false;
  viewRecipesLimit: number = 4;
  isAuthenticated: boolean = false;
  confirmDeleteId: number | null = null;
  locale: string = localStorage.getItem("lang") ?? navigator.language;

  constructor(
    private collectionService: RecipeCollectionService,
    public sessionService: SessionService,
    private userService: UserService,
    private router: Router,
    private translatorService: TranslatorService
  ) {}

  ngOnInit(): void {
    this.sessionService.getLoggedUser().subscribe(() => {
      this.isAuthenticated = !!this.sessionService.currentUser;
    })

    document.getElementsByTagName("html")[0].style.overflow = 'hidden';

    if (this.mode === 'list' && this.username) {
      this.loadCollections();
    } else if (this.mode === 'add-dialog' && this.showDialog) {
      if (this.collectionList.length > 0) {
        this.collections = [...this.collectionList];
      } else {
        this.loadUserCollections();
      }
    }

    this.translatorService.onChange(() => {
      this.locale = this.translatorService.getLang();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mode === 'add-dialog' && this.showDialog && changes['showDialog']) {
      this.loadUserCollections();
    }

    if (changes['collectionList'] && changes['collectionList'].currentValue) {
      if (this.mode === 'add-dialog') {
        this.collections = [...changes['collectionList'].currentValue];
      }
    }

    if (changes['collections'] && changes['collections'].currentValue) {
      this.collections = [...changes['collections'].currentValue];
    }
  }

  loadCollections(): void {
    if (!this.username) return;

    this.loading = true;
    this.currentPage = 0;
    this.userService.getUserCollections(this.username, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.hasMore = response.hasMore;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.loading = false;
      }
    });
  }

  loadUserCollections(): void {
    if (!this.sessionService.currentUser) return;

    this.loading = true;
    this.collectionService.getAllUserCollections(this.sessionService.currentUser.username).subscribe({
      next: (collections) => {
        console.log('Loaded collections in collection-card:', collections.length);
        this.collections = collections.filter(c => !c.isFavorites);
        console.log('After filtering favorites:', this.collections.length);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.loading = false;
      }
    });
  }

  loadMoreCollections(): void {
    if (this.loadingMore || !this.hasMore || !this.username) return;

    this.loadingMore = true;
    this.currentPage++;

    this.userService.getUserCollections(this.username, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.collections = [...this.collections, ...response.content];
        this.hasMore = response.hasMore;
        this.loadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more collections:', error);
        this.loadingMore = false;
        this.currentPage--;
      }
    });
  }

  viewCollection(collection: RecipeCollection): void {
    this.onView.emit(collection);
  }

  deleteCollection(collectionId: number, event: Event, confirmDelete?: boolean): void {
    if (this.confirmDeleteId !== collectionId && !confirmDelete) {
      this.confirmDeleteId = collectionId;
      return;
    }
    this.collectionService.deleteCollection(collectionId).subscribe({
      next: () => {
        this.collections = this.collections.filter(c => c.id !== collectionId);
        this.confirmDeleteId = null;
        setTimeout(() => {
          this.closeDialog(event);
          this.collectionList.splice(this.collectionList.findIndex(c => c.id === collectionId), 1);
          this.collections.slice(this.collections.findIndex(c => c.id === collectionId), 1);
        }, 1000);
      },
      error: (err) => {
        this.router.navigate(['/error'], {state: {status: err.status, reason: err.message}});
        this.confirmDeleteId = null;
      }
    });
  }

  startEdit(collectionId: number): void {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      this.editingCollectionId = collectionId;
      this.editingCollectionTitle = collection.title;
    }
  }

  saveEdit(): void {
    if (!this.editingCollectionId || !this.editingCollectionTitle.trim()) return;

    this.collectionService.updateCollectionTitle(this.editingCollectionId, this.editingCollectionTitle).subscribe({
      next: (updatedCollection) => {
        const index = this.collections.findIndex(c => c.id === this.editingCollectionId);
        if (index !== -1) {
          this.collections[index] = updatedCollection;
        }
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error updating collection:', error);
        alert('Error updating collection. Please try again.');
      }
    });
  }

  cancelEdit(): void {
    this.editingCollectionId = null;
    this.editingCollectionTitle = '';
  }

  newDate() {
    return new Date();
  }

  convertDate(date: string): string {
    const newDate = new Date(date);

    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(newDate);
  }

  addToCollection(collectionId: number, event: Event): void {
    if (!this.recipeId) return;

    this.collectionService.addRecipeToCollection(collectionId, this.recipeId).subscribe({
      next: () => {
        this.onAdded.emit();
        this.closeDialog(event);
      },
      error: (error) => {
        console.error('Error adding recipe to collection:', error);
      }
    });
  }

  toggleCreateNew(): void {
    this.showCreateNew = !this.showCreateNew;
    this.newCollectionTitle = '';
  }

  createAndAdd(event: Event): void {
    if (!this.newCollectionTitle.trim() || !this.recipeId) return;

    this.creating = true;
    this.collectionService.createCollection(this.newCollectionTitle).subscribe({
      next: (collection) => {
        this.collectionService.addRecipeToCollection(collection.id, this.recipeId!).subscribe({
          next: () => {
            this.onAdded.emit();
            this.closeDialog(event);
            this.creating = false;
          },
          error: (error) => {
            console.error('Error adding recipe to new collection:', error);
            this.creating = false;
          }
        });
      },
      error: (error) => {
        console.error('Error creating collection:', error);
        this.creating = false;
      }
    });
  }

  createCollection(event: Event): void {
    if (!this.newCollectionTitle.trim()) return;

    this.creating = true;
    this.collectionService.createCollection(this.newCollectionTitle).subscribe({
      next: (collection) => {
        this.collections.push(collection);
        ((event.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
        this.showCreateNew = false;
        this.newCollectionTitle = '';
        this.creating = false;
        this.onCreate.emit();
      },
      error: (error) => {
        console.error('Error creating collection:', error);
        this.creating = false;
      }
    });
  }

  openCreateModal(): void {
    this.showCreateNew = true;
    document.getElementsByTagName("html")[0].style.overflow = 'hidden';
  }

  closeDialog(event: Event): void {
    this.showCreateNew = false;
    this.newCollectionTitle = '';
    this.viewRecipesLimit = 4;
    ((event.target as HTMLElement).closest('.visibleBackdrop')?.classList.remove('visibleBackdrop'));
    setTimeout(() => {
      this.onClose.emit();
    }, 500)
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDialog(event);
    }
  }

  getCollectionImage(collection: RecipeCollection): string {
    if (collection.recipes && collection.recipes.length > 0) {
      return collection.recipes[0].imageString || '';
    }
    return '';
  }

  getVisibleRecipes(): any[] {
    if (!this.collection?.recipes) return [];
    return this.collection.recipes.slice(0, this.viewRecipesLimit);
  }

  hasMoreRecipesToShow(): boolean {
    if (!this.collection?.recipes) return false;
    return this.collection.recipes.length > this.viewRecipesLimit;
  }

  getRemainingRecipesCount(): number {
    if (!this.collection?.recipes) return 0;
    return this.collection.recipes.length - this.viewRecipesLimit;
  }

  loadMoreViewRecipes(event: Event): void {
    event.stopPropagation();
    this.viewRecipesLimit += 4;
  }

  navigateToRecipe(recipeId: number, event: Event): void {
    this.closeDialog(event);
    this.router.navigate(['/recipes', recipeId]);
  }

  navigateToUser(username: string, event: Event): void {
    event.stopPropagation();
    this.closeDialog(event);
    this.router.navigate(['/users', username]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.delete-collection-btn')) {
      this.confirmDeleteId = null;
    }
  }

  public t = (key: string) => this.translatorService.translate(key);
  protected readonly Date = Date;
}
