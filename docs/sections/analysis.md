# 🔍 Analysis

- [Screens & Navigation](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#screens--navigation)
    - [Landing Page](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#landing-page)
    - [Authentication - Login](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#authentication---login)
    - [Authentication - Signup](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#authentication---signup)
    - [Explore](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#explore)
    - [Recipe View](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#recipe-view)
    - [Recipe Edit](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#recipe-edit)
    - [Profile View](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#profile-view)
    - [Profile Edit](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#profile-edit)
    - [Ingredients](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#ingredients)
    - [Health Reports](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#health-reports)
    - [Admin Panel](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#admin-panel)
    - [Error Page](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#error-page)
- [Entities](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#entities)
- [User Permissions](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#user-permissions)
- [Images](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#images)
- [Charts](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#charts)
- [Complementary Technology](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#complementary-technology)
- [Advanced Algorithm/Query](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#advanced-algorithmquery)
- [Optional Addons](https://github.com/codeurjc-students/2025-Rarecips/tree/main?tab=readme-ov-file#optional-addons)

## Screens & Navigation

<p align="center">
   <img src="../readme-resources/NavDiagram.svg"/>
</p>

## Landing Page
The main entry point of the application, showcasing featured recipes, collections, etc. and allowing users to explore the platform.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile, Recipe

<p>
   <img src="../readme-resources/landing.jpg"/>
</p>

## Authentication - Login
User login screen with email/username and password authentication.
### Pages that can be accessed from here:
- Signup, Landing

<p>
   <img src="../readme-resources/login.jpg"/>
</p>

## Authentication - Signup
User registration screen for creating new accounts with profile information.
### Pages that can be accessed from here:
- Login

<p>
   <img src="../readme-resources/signup.jpg"/>
</p>

## Explore
Browse and search through all available recipes, users, ingredients and collections with filtering capabilities.
### Pages that can be accessed from here:
- Landing, Login, Signup, Admin, Ingredients, Health, Profile, Recipe

<p>
   <img src="../readme-resources/explore.jpg"/>
</p>

## Recipe View
Detailed view of individual recipes showing ingredients, instructions, and user reviews.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile

<p>
   <img src="../readme-resources/recipe.jpg"/>
</p>

## Recipe Edit
Create and edit recipes with rich text formatting and media upload capabilities.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile

<p>
   <img src="../readme-resources/editRecipe.jpg"/>
</p>

## Profile View
Display user information, statistics, and personal recipe collections.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Recipe

<p>
   <img src="../readme-resources/profile.jpg"/>
</p>

## Profile Edit
Edit user profile information, preferences, and account settings.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile

<p>
   <img src="../readme-resources/editProfile.jpg"/>
</p>

## Ingredients
Manage and browse ingredient database with nutritional information.
### Pages that can be accessed from here:
- Login, Signup, Admin, Health, Explore, Profile

<p>
   <img src="../readme-resources/ingredients.jpg"/>
</p>

## Health Reports
View personalized health and nutrition reports based on recipe consumption.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Explore, Profile

<p>
   <img src="../readme-resources/health.jpg"/>
</p>

## Admin Panel
Administrative dashboard for content moderation and system analytics (Admin users only).
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile

<p>
   <img src="../readme-resources/admin.jpg"/>
</p>

## Error Page
Custom error page for handling various application errors gracefully.
### Pages that can be accessed from here:
- Login, Signup, Admin, Ingredients, Health, Explore, Profile

<p>
   <img src="../readme-resources/error.jpg"/>
</p>

## Entities
- **User:** username, display name, bio, profile image, email, password, role, creation date, last online date
- **Recipe:** id, label, image, people, ingredients, difficulty, dish types, meal types, cuisine type, diet labels, health labels, cautions, time, weight, calories, average rating, author, reviews, creation date, modification date
- **Review:** id, recipe, rating, comment, author, creation date, modification date
- **Ingredient** id, description, quantity, measure, weight

## User Permissions

|          | Unregistered | Registered | Admin |
|--------------------------|:------------:|:----------:|:-----:|
| Browse recipes            |      ✓       |     ✓      |   ✓   |
| View recipes              |      ✓       |     ✓      |   ✓   |
| Recipe CRUD               |              |     ✓      |   ✓   |
| Profile CRUD              |              |     ✓      |   ✓   |
| Report querying           |              |     ✓      |   ✓   |
| User stats                |              |     ✓      |   ✓   |
| Ingredient CRUD           |              |            |   ✓   |
| Content moderation        |              |            |   ✓   |
| User moderation           |              |            |   ✓   |
| System analytics viewing  |              |            |   ✓   |

## Images
- Recipes: Multiple images per recipe, with images in ingredients
- Users: Avatar image

## Charts
- Registered personal stats: Bar and pie charts for own user's content and profile
- Admin dashboard: Bar and pie charts for recipe stats, user activity

## Complementary Technology
- Notifications through websockets
- Recipe exporting to PDF
- User lists batch importing/exporting

## Advanced Algorithm/Query
- Personalized recipe recommendations based on user preferences and activity

## Optional Addons
- Automated testing
- Native Image Packaging
- Cloud Deployment (app, database)
- Continuous Deployment
- WebSockets as Rest-complementary communication technology
- Responsive mobile design
