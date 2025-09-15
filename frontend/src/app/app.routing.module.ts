import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
  
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { ErrorComponent } from './components/error/error.component';

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "login", component: AuthComponent },
  { path: "register", component: AuthComponent },
  { path: "error", component: ErrorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: "enabled" })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
