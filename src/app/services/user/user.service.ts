import { inject, Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { ProfileService } from '../profile/profile.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    protected user: User | null = null;
    private _supabaseService = inject(SupabaseService);
    private _profileService = inject(ProfileService);
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

        const session = await this._supabaseService.getSession(true);
        const isSessionValid = !!session?.user && !!session?.expires_at && session.expires_at > Math.floor(Date.now() / 1000);

        if (isSessionValid) {
            // Verificar que el usuario local coincide con la sesión
            const localUser = this.getUser();
            if (localUser && localUser.id !== session!.user.id) {
                this.clearUser();
                this._profileService.clearProfile();
            }
            this.setUser(session!.user);
        } else {
            this.clearUser();
            this._profileService.clearProfile();
            this._supabaseService.clearSessionCache();
        }

        const { data } = this._supabaseService.authChanges((event, updatedSession) => {
            if (event === 'SIGNED_OUT') {
                this.clearUser();
                this._profileService.clearProfile();
            } else if (updatedSession?.user) {
                this.setUser(updatedSession.user);
            } else {
                this.clearUser();
                this._profileService.clearProfile();
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

    public async signOut(): Promise<void> {
        this.destroyAuthSync();
        this.clearUser();
        this._profileService.clearProfile();
        this._supabaseService.clearSessionCache();
        await this._supabaseService.signOut();
    }
}