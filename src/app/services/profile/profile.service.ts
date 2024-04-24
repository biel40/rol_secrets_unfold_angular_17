import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Profile } from '../supabase/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {

    protected profile: Profile | null = null;

    constructor() {
        const storedProfile = localStorage.getItem('profile');

        if (storedProfile) {
            this.profile = JSON.parse(storedProfile);
        }
    }

    public setProfile(profile: Profile | null) : void  {
        this.profile = profile;
        localStorage.setItem('profile', JSON.stringify(profile));
    }

    public getProfile(): Profile | null{
        return this.profile;
    }

    public clearProfile() {
        this.profile = null;
        localStorage.removeItem('profile');
    }

    public isLoggedIn(): boolean {
        return !!this.profile;
    }
}