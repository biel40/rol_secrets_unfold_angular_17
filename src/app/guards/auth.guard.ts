import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase/supabase.service';
import { UserService } from '../services/user/user.service';

export const authGuard: CanActivateFn = async () => {
  const userService = inject(UserService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  try {
    const session = await supabaseService.getSession();
    const isSessionValid = !!session?.user && 
                           !!session?.expires_at && 
                           session.expires_at > Math.floor(Date.now() / 1000);

    if (!isSessionValid) {
      userService.clearUser();
      return router.createUrlTree(['']);
    }

    const user = session!.user;
    userService.setUser(user);

    if (user.email_confirmed_at) {
      return true;
    }
  } catch (error) {
    console.error('Auth guard error:', error);
  }

  return router.createUrlTree(['']);
};
