import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-ingredients',
  imports: [CommonModule, FormsModule],
  templateUrl: './ingredients.component.html',
  styleUrl: './ingredients.component.css'
})
export class IngredientsComponent {
  categoryIcons: { [key: string]: string } = {
    'Vegetables': 'ti-leaf',
    'Fruits': 'ti-apple',
    'Meats': 'ti-meat',
    'Fish & Seafood': 'ti-fish',
    'Dairy': 'ti-milk',
    'Cereals': 'ti-wheat',
    'Spices': 'ti-pepper',
    'Condiments': 'ti-bottle',
    'Beverages': 'ti-cup',
    'Others': 'ti-package'
  };
}
