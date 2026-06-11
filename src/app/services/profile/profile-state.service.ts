import { Injectable, inject, signal } from '@angular/core';
import { Hability, Item, Profile, SupabaseService } from '../supabase/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileStateService {
    private readonly _supabaseService = inject(SupabaseService);

    // --- State signals ---
    public readonly profile = signal<Profile | null>(null);
    public readonly userHabilities = signal<Hability[]>([]);
    public readonly habilitiesLoading = signal<boolean>(false);
    public readonly items = signal<Item[]>([]);
    public readonly itemsLoading = signal<boolean>(false);

    /**
     * Fetches profile, habilities and inventory in parallel.
     * Call this once in ProfileComponent.ngOnInit so ALL tabs render instantly.
     */
    public async loadProfileWithHabilities(userId: string): Promise<Profile | null> {
        const { data: profile } = await this._supabaseService.getProfileInfo(userId);
        this.profile.set(profile);

        if (profile) {
            await Promise.all([
                this._fetchHabilities(profile),
                this._fetchItems(userId)
            ]);
        }

        return profile;
    }

    /** Re-fetches habilities for the current profile (e.g. after uses change). */
    public async refreshHabilities(): Promise<void> {
        const profile = this.profile();
        if (profile) {
            await this._fetchHabilities(profile);
        }
    }

    /** Adds an item and updates the signal optimistically from the server response. */
    public async addItem(item: Item, userId: string): Promise<boolean> {
        try {
            item.profile_id = userId;
            item.quantity = 1;
            const { data, error } = await this._supabaseService.saveItemToProfile(item);
            if (error) throw error;
            if (data) {
                this.items.update(list => [...list, ...data]);
            }
            return true;
        } catch {
            return false;
        }
    }

    /** Removes an item from the signal and deletes it from the DB. */
    public async removeItem(item: Item): Promise<boolean> {
        try {
            await this._supabaseService.deleteItemFromProfile(item);
            this.items.update(list => list.filter(i => i.id !== item.id));
            return true;
        } catch {
            return false;
        }
    }

    /** Clears all state on sign-out. */
    public clear(): void {
        this.profile.set(null);
        this.userHabilities.set([]);
        this.items.set([]);
    }

    private async _fetchHabilities(profile: Profile): Promise<void> {
        this.habilitiesLoading.set(true);
        try {
            const habilities = await this._supabaseService.getHabilitiesFromUser(profile);
            this.userHabilities.set(habilities);
        } finally {
            this.habilitiesLoading.set(false);
        }
    }

    private async _fetchItems(userId: string): Promise<void> {
        this.itemsLoading.set(true);
        try {
            const { data } = await this._supabaseService.getItems(userId);
            this.items.set(data || []);
        } finally {
            this.itemsLoading.set(false);
        }
    }
}
