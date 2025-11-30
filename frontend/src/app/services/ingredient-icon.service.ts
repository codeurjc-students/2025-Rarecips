import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IngredientIconService {

  private iconMap: { [key: string]: string } = {
    // Fruit
    'apple': 'ti-apple',
    'banana': 'ti-leaf',
    'lemon': 'ti-lemon-2',
    'orange': 'ti-lemon',
    'cherry': 'ti-apple',
    'grape': 'ti-apple',
    'strawberry': 'ti-apple',
    'watermelon': 'ti-melon',
    'melon': 'ti-melon',
    'pineapple': 'ti-apple',
    'peach': 'ti-apple',
    'pear': 'ti-apple',
    'avocado': 'ti-avocado',
    'mango': 'ti-apple',
    'kiwi': 'ti-apple',
    'coconut': 'ti-apple',
    'fruit': 'ti-apple',

    // Vegetables
    'tomato': 'ti-plant',
    'carrot': 'ti-carrot',
    'potato': 'ti-plant-2',
    'onion': 'ti-plant-2',
    'garlic': 'ti-plant-2',
    'pepper': 'ti-pepper',
    'bell pepper': 'ti-pepper',
    'chili': 'ti-flame',
    'lettuce': 'ti-salad',
    'salad': 'ti-salad',
    'spinach': 'ti-plant-2',
    'broccoli': 'ti-tree',
    'cucumber': 'ti-plant',
    'mushroom': 'ti-mushroom',
    'corn': 'ti-plant',
    'pumpkin': 'ti-plant-2',
    'eggplant': 'ti-plant',
    'cabbage': 'ti-plant',
    'celery': 'ti-plant',
    'zucchini': 'ti-plant',
    'asparagus': 'ti-plant',
    'vegetable': 'ti-carrot',

    // Meat
    'meat': 'ti-meat',
    'beef': 'ti-meat',
    'pork': 'ti-pig',
    'chicken': 'ti-meat',
    'turkey': 'ti-meat',
    'lamb': 'ti-meat',
    'bacon': 'ti-pig',
    'sausage': 'ti-sausage',
    'ham': 'ti-pig',
    'steak': 'ti-meat',
    'protein': 'ti-meat',

    // Fish
    'fish': 'ti-fish',
    'salmon': 'ti-fish',
    'tuna': 'ti-fish',
    'cod': 'ti-fish',
    'shrimp': 'ti-fish',
    'prawn': 'ti-fish',
    'lobster': 'ti-fish',
    'crab': 'ti-fish',
    'oyster': 'ti-fish',
    'mussel': 'ti-fish',
    'clam': 'ti-fish',
    'seafood': 'ti-fish',

    // Dairy
    'milk': 'ti-milk',
    'cheese': 'ti-cheese',
    'butter': 'ti-milk',
    'cream': 'ti-bottle',
    'yogurt': 'ti-cup',
    'yoghurt': 'ti-cup',
    'dairy': 'ti-milk',

    // Egg
    'egg': 'ti-egg',
    'eggs': 'ti-egg',

    // Bread amd grain
    'bread': 'ti-baguette',
    'toast': 'ti-bread',
    'baguette': 'ti-baguette',
    'rice': 'ti-circle-dot',
    'pasta': 'ti-circle-dot',
    'spaghetti': 'ti-circle-dot',
    'noodle': 'ti-circle-dot',
    'macaroni': 'ti-circle-dot',
    'flour': 'ti-wheat',
    'wheat': 'ti-wheat',
    'oat': 'ti-circle-dot',
    'cereal': 'ti-wheat',
    'quinoa': 'ti-circle-dot',
    'barley': 'ti-circle-dot',
    'grain': 'ti-circle-dot',

    //Drinks
    'coffee': 'ti-coffee',
    'tea': 'ti-mug',
    'wine': 'ti-glass',
    'beer': 'ti-beer',
    'juice': 'ti-beer',
    'water': 'ti-droplet',
    'soda': 'ti-beer',
    'drink': 'ti-bottle',

    // Sweets and desserts
    'dessert': 'ti-cake',
    'pie': 'ti-cake',
    'cake': 'ti-cake',
    'cookie': 'ti-cookie',
    'candy': 'ti-candy',
    'sugar': 'ti-candy',
    'honey': 'ti-droplet',
    'ice cream': 'ti-ice-cream',
    'icecream': 'ti-ice-cream',
    'sweet': 'ti-candy',

    // Condiments
    'salt': 'ti-salt',
    'oil': 'ti-bottle',
    'vinegar': 'ti-bottle',
    'sauce': 'ti-bottle',
    'ketchup': 'ti-bottle',
    'mustard': 'ti-bottle',
    'mayonnaise': 'ti-bottle',
    'soy sauce': 'ti-bottle',
    'black pepper': 'ti-pepper',
    'spice': 'ti-pepper',
    'herb': 'ti-plant',
    'basil': 'ti-plant',
    'oregano': 'ti-plant',
    'thyme': 'ti-plant',
    'rosemary': 'ti-plant',
    'parsley': 'ti-plant',
    'cilantro': 'ti-plant',
    'mint': 'ti-plant',
    'cinnamon': 'ti-pepper',
    'ginger': 'ti-plant-2',
    'curry': 'ti-pepper',
    'paprika': 'ti-pepper',
    'condiment': 'ti-bottle',

    // Nuts and seeds
    'nut': 'ti-circle-dot',
    'almond': 'ti-circle-dot',
    'walnut': 'ti-circle-dot',
    'peanut': 'ti-circle-dot',
    'cashew': 'ti-circle-dot',
    'pistachio': 'ti-circle-dot',
    'hazelnut': 'ti-circle-dot',
    'seed': 'ti-circle-dot',
    'sunflower': 'ti-sun',

    // Legumes
    'bean': 'ti-circle-dot',
    'lentil': 'ti-circle-dot',
    'chickpea': 'ti-circle-dot',
    'pea': 'ti-circle-dot',
    'soy': 'ti-circle-dot',
    'soybean': 'ti-circle-dot',
    'tofu': 'ti-box',
    'legume': 'ti-circle-dot',

    // fast food
    'pizza': 'ti-pizza',
    'burger': 'ti-burger',
    'sandwich': 'ti-bread',
    'hotdog': 'ti-sausage',
    'taco': 'ti-meat',
    'burrito': 'ti-meat',

    // Miscellaneous
    'soup': 'ti-soup',
    'bowl': 'ti-bowl',
    'bottle': 'ti-bottle',
    'can': 'ti-box',
    'jar': 'ti-bottle',
    'box': 'ti-box',
    'package': 'ti-package',
  };

  constructor() { }

  getIconForIngredient(ingredientName: string): string {
    if (!ingredientName) {
      return 'ti-apple';
    }

    const normalizedName = ingredientName.toLowerCase().trim();

    if (this.iconMap[normalizedName]) {
      return this.iconMap[normalizedName];
    }

    for (const [keyword, icon] of Object.entries(this.iconMap)) {
      if (normalizedName.includes(keyword)) {
        return icon;
      }
    }

    return 'ti-circles';
  }
}


