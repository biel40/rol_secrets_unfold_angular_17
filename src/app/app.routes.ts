import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';

export const routes: Routes = [
    { path: '', component: AuthComponent},
    
    // { path: 'account', component: AccountComponent},
    // { path: 'attackList', component: AttackListComponent, pathMatch: 'full'},
    // { path: 'accountEdit', component: AccountEditComponent, pathMatch: 'full'},
    // { path: 'statsEdit', component: StatsEditComponent, pathMatch: 'full'},
    // { path: 'checkRolStats', component: CheckRolStatsComponent, pathMatch: 'full'},
  ];
