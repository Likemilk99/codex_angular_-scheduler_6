import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverManagerPageComponent } from './pages/driver-manager/driver-manager-page.component';

const routes: Routes = [
  { path: 'driver-manager', component: DriverManagerPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'driver-manager' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
