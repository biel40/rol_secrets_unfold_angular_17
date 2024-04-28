import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';

export const routes: Routes = [
    { path: '', component: AuthComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'profile-edit', component: ProfileEditComponent},
    // { path: 'attackList', component: AttackListComponent, pathMatch: 'full'},
    // { path: 'checkRolStats', component: CheckRolStatsComponent, pathMatch: 'full'},
  ];
