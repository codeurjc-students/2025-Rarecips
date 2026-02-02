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
  private categoryMap: { [key: string]: string } = {
    // Fruit
    'apple': 'Fruit',
    'banana': 'Fruit',
    'lemon': 'Fruit',
    'orange': 'Fruit',
    'cherry': 'Fruit',
    'grape': 'Fruit',
    'strawberry': 'Fruit',
    'watermelon': 'Fruit',
    'melon': 'Fruit',
    'pineapple': 'Fruit',
    'peach': 'Fruit',
    'pear': 'Fruit',
    'avocado': 'Fruit',
    'mango': 'Fruit',
    'kiwi': 'Fruit',
    'coconut': 'Fruit',
    'fruit': 'Fruit',

    // Vegetables
    'tomato': 'Vegetables',
    'carrot': 'Vegetables',
    'potato': 'Vegetables',
    'onion': 'Vegetables',
    'garlic': 'Vegetables',
    'pepper': 'Vegetables',
    'bell pepper': 'Vegetables',
    'chili': 'Vegetables',
    'lettuce': 'Vegetables',
    'salad': 'Vegetables',
    'spinach': 'Vegetables',
    'broccoli': 'Vegetables',
    'cucumber': 'Vegetables',
    'mushroom': 'Vegetables',
    'corn': 'Vegetables',
    'pumpkin': 'Vegetables',
    'eggplant': 'Vegetables',
    'cabbage': 'Vegetables',
    'celery': 'Vegetables',
    'zucchini': 'Vegetables',
    'asparagus': 'Vegetables',
    'vegetable': 'Vegetables',

    // Meat
    'meat': 'Meat',
    'beef': 'Meat',
    'pork': 'Meat',
    'chicken': 'Meat',
    'turkey': 'Meat',
    'lamb': 'Meat',
    'bacon': 'Meat',
    'sausage': 'Meat',
    'ham': 'Meat',
    'steak': 'Meat',
    'protein': 'Meat',

    // Fish
    'fish': 'Fish',
    'salmon': 'Fish',
    'tuna': 'Fish',
    'cod': 'Fish',
    'shrimp': 'Fish',
    'prawn': 'Fish',
    'lobster': 'Fish',
    'crab': 'Fish',
    'oyster': 'Fish',
    'mussel': 'Fish',
    'clam': 'Fish',
    'seafood': 'Fish',

    // Dairy
    'milk': 'Dairy',
    'cheese': 'Dairy',
    'butter': 'Dairy',
    'cream': 'Dairy',
    'yogurt': 'Dairy',
    'yoghurt': 'Dairy',
    'dairy': 'Dairy',

    // Egg
    'egg': 'Egg',
    'eggs': 'Egg',

    // Bread and grain
    'bread': 'Bread & Grain',
    'toast': 'Bread & Grain',
    'baguette': 'Bread & Grain',
    'rice': 'Bread & Grain',
    'pasta': 'Bread & Grain',
    'spaghetti': 'Bread & Grain',
    'noodle': 'Bread & Grain',
    'macaroni': 'Bread & Grain',
    'flour': 'Bread & Grain',
    'wheat': 'Bread & Grain',
    'oat': 'Bread & Grain',
    'cereal': 'Bread & Grain',
    'quinoa': 'Bread & Grain',
    'barley': 'Bread & Grain',
    'grain': 'Bread & Grain',

    // Drinks
    'coffee': 'Drinks',
    'tea': 'Drinks',
    'wine': 'Drinks',
    'beer': 'Drinks',
    'juice': 'Drinks',
    'water': 'Drinks',
    'soda': 'Drinks',
    'drink': 'Drinks',

    // Sweets and desserts
    'dessert': 'Sweets & Desserts',
    'pie': 'Sweets & Desserts',
    'cake': 'Sweets & Desserts',
    'cookie': 'Sweets & Desserts',
    'candy': 'Sweets & Desserts',
    'sugar': 'Sweets & Desserts',
    'honey': 'Sweets & Desserts',
    'ice cream': 'Sweets & Desserts',
    'icecream': 'Sweets & Desserts',
    'sweet': 'Sweets & Desserts',

    // Condiments
    'salt': 'Condiments',
    'oil': 'Condiments',
    'vinegar': 'Condiments',
    'sauce': 'Condiments',
    'ketchup': 'Condiments',
    'mustard': 'Condiments',
    'mayonnaise': 'Condiments',
    'soy sauce': 'Condiments',
    'black pepper': 'Condiments',
    'spice': 'Condiments',
    'herb': 'Condiments',
    'basil': 'Condiments',
    'oregano': 'Condiments',
    'thyme': 'Condiments',
    'rosemary': 'Condiments',
    'parsley': 'Condiments',
    'cilantro': 'Condiments',
    'mint': 'Condiments',
    'cinnamon': 'Condiments',
    'ginger': 'Condiments',
    'curry': 'Condiments',
    'paprika': 'Condiments',
    'condiment': 'Condiments',

    // Nuts and seeds
    'nut': 'Nuts & Seeds',
    'almond': 'Nuts & Seeds',
    'walnut': 'Nuts & Seeds',
    'peanut': 'Nuts & Seeds',
    'cashew': 'Nuts & Seeds',
    'pistachio': 'Nuts & Seeds',
    'hazelnut': 'Nuts & Seeds',
    'seed': 'Nuts & Seeds',
    'sunflower': 'Nuts & Seeds',

    // Legumes
    'bean': 'Legumes',
    'lentil': 'Legumes',
    'chickpea': 'Legumes',
    'pea': 'Legumes',
    'soy': 'Legumes',
    'soybean': 'Legumes',
    'tofu': 'Legumes',
    'legume': 'Legumes',

    // Fast food
    'pizza': 'Fast Food',
    'burger': 'Fast Food',
    'sandwich': 'Fast Food',
    'hotdog': 'Fast Food',
    'taco': 'Fast Food',
    'burrito': 'Fast Food',

    // Miscellaneous
    'soup': 'Miscellaneous',
    'bowl': 'Miscellaneous',
    'bottle': 'Miscellaneous',
    'can': 'Miscellaneous',
    'jar': 'Miscellaneous',
    'box': 'Miscellaneous',
    'package': 'Miscellaneous',
  };
  private categoryTranslations: { [key: string]: { [lang: string]: string } } = {
    'Fruit': {
      es: 'Fruta', en: 'Fruit', fr: 'Fruit', zh: '水果', ja: 'フルーツ'
    },
    'Vegetables': {
      es: 'Verduras', en: 'Vegetables', fr: 'Légumes', zh: '蔬菜', ja: '野菜'
    },
    'Meat': {
      es: 'Carne', en: 'Meat', fr: 'Viande', zh: '肉类', ja: '肉'
    },
    'Fish': {
      es: 'Pescado y marisco', en: 'Fish & Seafood', fr: 'Poisson & Fruits de mer', zh: '鱼和海鲜', ja: '魚介類'
    },
    'Dairy': {
      es: 'Lácteos', en: 'Dairy', fr: 'Produits laitiers', zh: '乳制品', ja: '乳製品'
    },
    'Egg': {
      es: 'Huevo', en: 'Egg', fr: 'Œuf', zh: '蛋', ja: '卵'
    },
    'Bread & Grain': {
      es: 'Pan y cereales', en: 'Bread & Grain', fr: 'Pain & Céréales', zh: '面包和谷物', ja: 'パン・穀物'
    },
    'Drinks': {
      es: 'Bebidas', en: 'Drinks', fr: 'Boissons', zh: '饮料', ja: '飲み物'
    },
    'Sweets & Desserts': {
      es: 'Dulces y postres', en: 'Sweets & Desserts', fr: 'Desserts & Sucreries', zh: '甜点', ja: 'スイーツ・デザート'
    },
    'Condiments': {
      es: 'Condimentos', en: 'Condiments', fr: 'Condiments', zh: '调味品', ja: '調味料'
    },
    'Nuts & Seeds': {
      es: 'Frutos secos y semillas', en: 'Nuts & Seeds', fr: 'Noix & Graines', zh: '坚果和种子', ja: 'ナッツ・種子'
    },
    'Legumes': {
      es: 'Legumbres', en: 'Legumes', fr: 'Légumineuses', zh: '豆类', ja: '豆類'
    },
    'Fast Food': {
      es: 'Comida rápida', en: 'Fast Food', fr: 'Restauration rapide', zh: '快餐', ja: 'ファストフード'
    },
    'Miscellaneous': {
      es: 'Varios', en: 'Miscellaneous', fr: 'Divers', zh: '杂项', ja: 'その他'
    }
  };

  constructor() { }

  getIconForIngredient(ingredientName: string): string {
    if (!ingredientName) {
      return 'ti-circles';
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

  getCategoryFromIcon(icon: string): string {
    for (const [keyword, iconValue] of Object.entries(this.iconMap)) {
      if (iconValue === icon) {
        return this.categoryMap[keyword] || 'Others';
      }
    }
    return 'Others';
  }
}
