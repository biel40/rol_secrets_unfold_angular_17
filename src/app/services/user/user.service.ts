import { inject, Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    protected user: User | null = null;
    private _supabaseService = inject(SupabaseService);
    private _authSubscription: { unsubscribe: () => void } | null = null;

    constructor() {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
    }

    public async initializeAuthSync(): Promise<void> {
        if (this._authSubscription) {
            return;
        }

        const session = await this._supabaseService.getSession();
        const isSessionValid = !!session?.user && !!session?.expires_at && session.expires_at > Math.floor(Date.now() / 1000);

        if (isSessionValid) {
            this.setUser(session!.user);
        } else {
            this.clearUser();
        }

        const { data } = this._supabaseService.authChanges((_, updatedSession) => {
            if (updatedSession?.user) {
                this.setUser(updatedSession.user);
            } else {
                this.clearUser();
            }
        });

        this._authSubscription = data?.subscription ?? null;
    }

    public setUser(user: User | null) : void  {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    public getUser(): User | null{
        return this.user;
    }

    public clearUser() {
        this.user = null;
        localStorage.removeItem('user');
    }

    public isLoggedIn(): boolean {
        return !!this.user;
    }

    public destroyAuthSync(): void {
        this._authSubscription?.unsubscribe();
        this._authSubscription = null;
    }
}