import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { NewProfileComponent } from './components/new-profile/new-profile.component';
import { ProfileStatsEditComponent } from './components/profile-stats-edit/profile-stats-edit.component';
import { AdminComponent } from './components/admin/admin-component/admin.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: AuthComponent },
  { path: 'sign-in', redirectTo: '', pathMatch: 'full' },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'profile-edit', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'new-profile', component: NewProfileComponent, canActivate: [authGuard] },
  { path: 'profile-stats-edit', component: ProfileStatsEditComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
