import { Injectable } from '@angular/core'
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  RealtimeChannel,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface Profile {
  id?: string  // This is the primary key that matches auth.users.id
  username?: string
  clase: string
  power: string
  level: number
  weapon: string,
  habilities?: Hability[],
  current_hp?: number,
  total_hp?: number,
  attack?: number,
  defense?: number,
  special_attack?: number,
  special_defense?: number,
  speed?: number,
  current_experience?: number,
  image_url?: string
}

export interface ProfileSummary {
  id?: string
  username?: string
  clase: string
  level: number
}

export interface Hability {
  id?: string
  name?: string
  description?: string
  clase: string
  power: string
  level: number
  total_uses: number
  current_uses: number
  dice: string
  scales_with: string
}

export interface Enemy {
  id: string,
  name: string,
  level: number,
  description: string,
  current_hp: number,
  total_hp: number,
  is_boss: boolean,
  image_url: string,
  defense?: number
}

export interface NPC {
  id: number,
  name: string,
  description: string,
  img_url: string
}

export interface Item {
  id: number,
  profile_id: string,
  name: string,
  description: string,
  quantity: number,
  value: number,
  img_src: string
}

export interface Mission {
  id?: number,
  title: string,
  description: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary',
  created_at?: string,
  updated_at?: string,
  assigned_to?: string,
  reward_xp?: number,
  reward_gold?: number
}

export interface UserReplica {
  id: string,
  email: string,
  created_at: string,
  updated_at?: string,
  last_sign_in_at?: string,
  email_confirmed_at?: string,
  phone?: string,
  phone_confirmed_at?: string,
  banned_until?: string,
  confirmation_sent_at?: string,
  recovery_sent_at?: string,
  email_change_sent_at?: string,
  new_email?: string,
  invited_at?: string,
  action_link?: string,
  email_change?: string,
  email_change_confirm_status?: number,
  phone_change?: string,
  phone_change_token?: string,
  phone_change_sent_at?: string,
  user_metadata?: {
    full_name?: string,
    [key: string]: any
  },
  app_metadata?: {
    [key: string]: any
  }
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private _supabaseClient: SupabaseClient;
  public _session: AuthSession | null = null;

  constructor() {
    this._supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  public async getSession() {
    if (!this._session) {
      const { data } = await this._supabaseClient.auth.getSession();
      this._session = data.session;
    }
    return this._session;
  }


  public profile(user: User) {
    return this._supabaseClient
      .from('profiles')
      .select(`username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
      .eq('id', user.id)
      .single();
  }

  public async getProfileInfo(userId: string): Promise<{ data: Profile | null, error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('profiles')
        .select(`id, username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience, image_url`)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error };
    }
  }

  // Method to get profile by user_id (not profile_id)
  public async getProfileByUserId(userId: string): Promise<{ data: Profile | null, error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)  // Changed from 'user_id' to 'id'
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting profile by user_id:', error);
      return { data: null, error };
    }
  }

  public async getAllHabilities(): Promise<Hability[] | null> {
    const { data: habilities, error } = await this._supabaseClient
      .from('habilities')
      .select('*');

    if (error) {
      console.error('Error fetching habilities:', error);
      return null;
    }

    return habilities;
  }

  public async getHabilities(profile: Profile): Promise<Hability[]> {
    let { data: habilities, error } = await this._supabaseClient
      .from('habilities')
      .select('*')
      .lte("level", profile.level)
      .eq("power", profile.power)
      .in("clase", ["Base", profile.clase])
      .order("level");

    return habilities ? habilities : [];
  }

  public async getHabilitiesFromUser(profile: Profile): Promise<Hability[]> {
    // We will fetch all the records in the table habilities that have a fk to the user in the intermediate table profile_habilities

    let { data: habilities, error } = await this._supabaseClient
      .from('profile_habilities')
      .select('*',)
      .eq('profile_id', profile.id);

    if (habilities && habilities.length > 0) {
      let habilitiesIds: string[] = habilities.map(hability => hability.hability_id);

      let { data: userHabilities, error } = await this._supabaseClient
        .from('habilities')
        .select('*')
        .in("id", habilitiesIds)
        .order("level");

      // Filter the habilities that the user has by the level of the user and the power of the user
      // and the class of the user. Allow 'Base' class habilities for any class
      if (userHabilities) {
        userHabilities = userHabilities.filter(hability => {
          const levelMatch = hability.level <= profile.level;
          const powerMatch = hability.power === profile.power;
          const classMatch = hability.clase === profile.clase || hability.clase === 'Base';
          
          return levelMatch && powerMatch && classMatch;
        });
      }      // We will set the current uses of the hability on the fly from the intermediate table
      // which are the REAL current uses.
      if (userHabilities) {
        userHabilities.forEach(hability => {
          let habilityInfo = habilities.find(h => h.hability_id === hability.id);

          if (habilityInfo) {
            hability.current_uses = habilityInfo.current_uses;
          }
        });
      }

      return userHabilities ? userHabilities : [];
    }

    return [];
  }

  // Function to update User's habilities
  public async updateHabilities(habilities: Hability[]): Promise<Hability[] | null> {
    try {
      const { data: habilitiesUpdated, error } = await this._supabaseClient
        .from('habilities')
        .upsert(habilities)
        .select('*');

      if (error) {
        throw error;
      }

      return habilitiesUpdated;
    } catch (error) {
      console.error('Error updating habilities:', error);
      return null;
    }
  }

  // Function to update only one hability
  public async updateHability(hability: Hability): Promise<void> {
    try {
      await this._supabaseClient
        .from('habilities')
        .upsert(hability)
        .select('*');

    } catch (error) {
      console.error(error);
    }
  }

  public async updateHabilityUses(hability: Hability, profile: Profile) {
    try {
      await this._supabaseClient
        .from('profile_habilities')
        .update({ current_uses: hability.current_uses })
        .eq('profile_id', profile.id)
        .eq('hability_id', hability.id);
    } catch (error) {
      console.error(error);
    }
  }

  // Function to create a new hability
  public async createHability(hability: Hability): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('habilities')
        .insert(hability)
        .select('*')
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating hability:', error);
      return { data: null, error };
    }
  }

  // Function to delete a hability
  public async deleteHability(habilityId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('habilities')
        .delete()
        .eq('id', habilityId);

      return { data, error };
    } catch (error) {
      console.error('Error deleting hability:', error);
      return { data: null, error };
    }
  }

  public authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this._supabaseClient.auth.onAuthStateChange(callback)
  }

  public signIn(email: string, password: string) {
    return this._supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  public signOut(): any {
    return this._supabaseClient.auth.signOut()
  }

  // Had to fix this manually to work
  public async updateProfile(profile: Profile) {

    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return await this._supabaseClient
      .from('profiles')
      .upsert(update)
      .select()
  }


  public async updateProfileStats(profile: Profile) {

    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return await this._supabaseClient
      .from('profiles')
      .upsert(update)
      .select(`current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
  }


  public async signUp(email: string, password: string) {
    return await this._supabaseClient.auth.signUp({
      email: email,
      password: password,
    });
  }

  public async insertProfile(profile: Profile) {
    return await this._supabaseClient
      .from('profiles')
      .insert(profile)
      .select();
  }

  public async upsertProfile(profile: Profile) {
    return await this._supabaseClient
      .from('profiles')
      .upsert(profile)
      .select();
  }

  public async getEnemies(): Promise<{ data: Enemy[] | null, error: any }> {
    return await this._supabaseClient
      .from('enemies')
      .select('*');
  }

  public async getBroadcastBattleChannel(): Promise<RealtimeChannel> {
    const channel = this._supabaseClient.channel('battle-channel-room');

    return channel;
  }

  public async getItems(userId: string): Promise<{ data: Item[] | null, error: any }> {
    return await this._supabaseClient
      .from('items')
      .select('*')
      .eq('profile_id', userId);
  }

  public async saveItemToProfile(item: Item): Promise<{ data: Item[] | null, error: any }> {
    if (item.id === 0) {
      // We will generate a random int to be the id of the item
      item.id = Math.floor(Math.random() * 1000000);
    }

    // We will insert the new item into the table items
    return await this._supabaseClient
      .from('items')
      .insert(item)
      .select();
  }

  public async deleteItemFromProfile(item: Item): Promise<{ data: any, error: any }> {
    return await this._supabaseClient
      .from('items')
      .delete()
      .eq('id', item.id);
  }

  public async deleteEnemy(enemyId: string): Promise<{ data: any, error: any }> {
    return await this._supabaseClient
      .from('enemies')
      .delete()
      .eq('id', enemyId);
  }

  // Function to create a new enemy
  public async createEnemy(enemy: Enemy): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('enemies')
        .insert(enemy)
        .select('*')
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating enemy:', error);
      return { data: null, error };
    }
  }

  // Function to update an enemy
  public async updateEnemy(enemy: Enemy): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('enemies')
        .update(enemy)
        .eq('id', enemy.id)
        .select('*')
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating enemy:', error);
      return { data: null, error };
    }
  }

  // NPC methods for Supabase integration
  public async getNPCs(): Promise<{ data: NPC[] | null, error: any }> {
    return await this._supabaseClient
      .from('npcs')
      .select('*');
  }

  public async createNPC(npc: NPC): Promise<{ data: NPC[] | null, error: any }> {
    return await this._supabaseClient
      .from('npcs')
      .insert(npc)
      .select();
  }

  public async updateNPC(npc: NPC): Promise<{ data: NPC[] | null, error: any }> {
    return await this._supabaseClient
      .from('npcs')
      .update(npc)
      .eq('id', npc.id)
      .select();
  }

  public async deleteNPC(npcId: number): Promise<{ data: any, error: any }> {
    return await this._supabaseClient
      .from('npcs')
      .delete()
      .eq('id', npcId);
  }

  // Mission methods for Supabase integration
  public async getMissions(): Promise<{ data: Mission[] | null, error: any }> {
    return await this._supabaseClient
      .from('misions')
      .select('*')
      .order('created_at', { ascending: false });
  }

  public async createMission(mission: Mission): Promise<{ data: Mission[] | null, error: any }> {
    const missionData = {
      ...mission,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this._supabaseClient
      .from('misions')
      .insert(missionData)
      .select();
  }

  public async updateMission(mission: Mission): Promise<{ data: Mission[] | null, error: any }> {
    const updateData = {
      ...mission,
      updated_at: new Date().toISOString()
    };

    return await this._supabaseClient
      .from('misions')
      .update(updateData)
      .eq('id', mission.id)
      .select();
  }

  public async deleteMission(missionId: number): Promise<{ data: any, error: any }> {
    return await this._supabaseClient
      .from('misions')
      .delete()
      .eq('id', missionId);
  }

  public async assignMissionToProfile(missionId: number, profileId: string): Promise<{ data: Mission[] | null, error: any }> {
    return await this._supabaseClient
      .from('misions')
      .update({
        assigned_to: profileId,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', missionId)
      .select();
  }

  public async getMissionsByProfile(profileId: string): Promise<{ data: Mission[] | null, error: any }> {
    return await this._supabaseClient
      .from('misions')
      .select('*')
      .eq('assigned_to', profileId)
      .order('created_at', { ascending: false });
  }

  // Methods for getting all profiles for mission assignment
  public async getAllProfiles(): Promise<{ data: ProfileSummary[] | null, error: any }> {
    return await this._supabaseClient
      .from('profiles')
      .select('id, username, clase, level')
      .order('username', { ascending: true });
  }

  public async getAllUsers(): Promise<{ data: UserReplica[] | null, error: any }> {
    try {
      const { data: users, error } = await this._supabaseClient
        .from('users_replica')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: users, error: null };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: null, error };
    }
  }

  public async getAllProfilesDetailed(): Promise<{ data: Profile[] | null, error: any }> {
    return await this._supabaseClient
      .from('profiles')
      .select('*')
      .order('username', { ascending: true });
  }

  public async createProfile(profile: Partial<Profile>): Promise<{ data: Profile | null, error: any }> {
    return await this._supabaseClient
      .from('profiles')
      .insert(profile)
      .select()
      .single();
  }

  public async deleteUser(userId: string): Promise<{ data: boolean | null, error: any }> {
    try {
      // First delete the profile
      await this._supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Then delete the user from users_replica table
      const { error } = await this._supabaseClient
        .from('users_replica')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { data: null, error };
    }
  }

  public async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null, error: any }> {
    return await this._supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  }

  public async createUserInReplica(userData: Partial<UserReplica>): Promise<{ data: UserReplica | null, error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('users_replica')
        .insert(userData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error creating user in replica:', error);
      return { data: null, error };
    }
  }

  public async updateUserInReplica(userId: string, updates: Partial<UserReplica>): Promise<{ data: UserReplica | null, error: any }> {
    try {
      const { data, error } = await this._supabaseClient
        .from('users_replica')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user in replica:', error);
      return { data: null, error };
    }
  }

  // Methods for managing hability-profile associations
  public async associateHabilityWithProfiles(habilityId: string, profileIds: string[]): Promise<{ data: any, error: any }> {
    try {
      // First, get the hability data to set correct initial current_uses
      const { data: habilityData, error: habilityError } = await this._supabaseClient
        .from('habilities')
        .select('total_uses')
        .eq('id', habilityId)
        .single();

      if (habilityError) throw habilityError;

      // Remove existing associations for this hability
      await this._supabaseClient
        .from('profile_habilities')
        .delete()
        .eq('hability_id', habilityId);

      if (profileIds.length > 0) {
        // Create new associations with correct initial current_uses
        const associations = profileIds.map(profileId => ({
          profile_id: profileId,
          hability_id: habilityId,
          current_uses: habilityData?.total_uses || 1 // Set to total_uses initially
        }));

        const { data, error } = await this._supabaseClient
          .from('profile_habilities')
          .insert(associations);

        if (error) throw error;
        return { data, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error associating hability with profiles:', error);
      return { data: null, error };
    }
  }

  public async getAssociatedProfiles(habilityId: string): Promise<string[]> {
    try {
      const { data, error } = await this._supabaseClient
        .from('profile_habilities')
        .select('profile_id')
        .eq('hability_id', habilityId);

      if (error) throw error;
      return data ? data.map(item => item.profile_id) : [];
    } catch (error) {
      console.error('Error getting associated profiles:', error);
      return [];
    }
  }

  public async getHabilitiesByProfile(profileId: string): Promise<string[]> {
    try {
      const { data, error } = await this._supabaseClient
        .from('profile_habilities')
        .select('hability_id')
        .eq('profile_id', profileId);

      if (error) throw error;
      return data ? data.map(item => item.hability_id) : [];
    } catch (error) {
      console.error('Error getting habilities by profile:', error);
      return [];
    }
  }
}