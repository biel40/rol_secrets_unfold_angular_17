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
  id?: string
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
  image_url: string
}

export interface Item {
  id: string,
  profile_id: string,
  name: string,
  description: string,
  quantity: number,
  value: number,
  img_src: string
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
      .single()
  }

  public async getProfileInfo(userId: string) {
    return this._supabaseClient
      .from('profiles')
      .select(`id, username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience, image_url`)
      .eq('id', userId)
      .single()
  }

  public async getAllHabilities() {
    let { data: habilities, error } = await this._supabaseClient
      .from('habilities')
      .select('*');
      
    return error ? error : habilities;
  }

  public async getHabilitiesFromUser(profile: Profile) : Promise<Hability[]> {
    let { data: habilities, error } = await this._supabaseClient
    .from('habilities')
    .select('*')
    .lte("level", profile.level)
    .eq("power", profile.power)
    .in("clase", ["Base", profile.clase])
    .order("level");

    return habilities ? habilities : [];
  } 

  // Function to update User's habilities
  public async updateHabilities(habilities: Hability[]) {
    try {
      let { data: habilitiesUpdated, error } = await this._supabaseClient
      .from('habilities')
      .upsert(habilities)
      .select('*');

      return error ? error : habilitiesUpdated;
    } catch(error) {
      return error;
    }
  }

  // Function to update only one hability
  public async updateHability(hability: Hability) : Promise<void> {
    try {
      await this._supabaseClient
      .from('habilities')
      .upsert(hability)
      .select('*');

    } catch(error) {
      console.error(error);
    }
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this._supabaseClient.auth.onAuthStateChange(callback)
  }

  public signIn(email: string, password: string) {
    return this._supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  public signOut() : any {
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

  public async getEnemies() {
    return await this._supabaseClient
    .from('enemies')
    .select('*');
  }

  public async getBroadcastBattleChannel() : Promise<RealtimeChannel> {
    const channel = this._supabaseClient.channel('battle-channel-room');

    return channel;
  }

  public async getItems(userId: string) {
    return await this._supabaseClient
    .from('items')
    .select('*')
    .eq('profile_id', userId);
  }

}