import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent, ConnectedComponent } from './pages';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'connected',
    component: ConnectedComponent
  },
  {
    path: '',
    pathMatch: "full",
    redirectTo: 'home'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
