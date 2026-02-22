import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {AuthComponent} from './components/auth/auth.component';

import {AppComponent} from './app.component';
import {provideHttpClient} from '@angular/common/http';
import {ErrorComponent} from './components/error/error.component';
import {ProfileViewComponent} from './components/profile-view/profile-view.component';
import {ProfileEditComponent} from './components/profile-edit/profile-edit.component';
import {ExploreComponent} from './components/explore/explore.component';
import {RecipeViewComponent} from './components/recipe-view/recipe-view.component';
import {RecipeEditComponent} from './components/recipe-edit/recipe-edit.component';
import {IngredientsComponent} from './components/ingredients/ingredients.component';
import {AdminPanelComponent} from './components/admin-panel/admin-panel.component';
import {HealthReportComponent} from './components/health-report/health-report.component';

export const routes: Routes = [
  {path: "", component: HomeComponent},
  {path: "login", component: AuthComponent},
  {path: "signup", component: AuthComponent},
  {path: "logout", redirectTo: "/"},
  {path: "users/:id", component: ProfileViewComponent},
  {path: "users/:id/edit", component: ProfileEditComponent},
  {path: "explore", component: ExploreComponent},
  {path: "recipes/create", component: RecipeEditComponent},
  {path: "recipes/:id", component: RecipeViewComponent},
  {path: "recipes/:id/edit", component: RecipeEditComponent},
  {path: "ingredients", component: IngredientsComponent},
  {path: "admin-panel", component: AdminPanelComponent},
  {path: "health", component: HealthReportComponent},
  {path: "error", component: ErrorComponent},
  {path: "change-password", component: AuthComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {scrollPositionRestoration: "enabled"})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
