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
  current_experience?: number
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

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private supabase: SupabaseClient;
  public _session: AuthSession | null = null;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  async getSession() {
    if (!this._session) {
      const { data } = await this.supabase.auth.getSession();
      this._session = data.session;
    }
    return this._session;
  }
  

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select(`username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
      .eq('id', user.id)
      .single()
  }

  public async getProfileInfo(userId: string) {
    return this.supabase
      .from('profiles')
      .select(`username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
      .eq('id', userId)
      .single()
  }

  async getAllHabilities() {
    let { data: habilities, error } = await this.supabase
      .from('habilities')
      .select('*');
      
    return error ? error : habilities;
  }

  async getHabilitiesFromUser(profile: Profile) : Promise<Hability[]> {
    let { data: habilities, error } = await this.supabase
    .from('habilities')
    .select('*')
    .lte("level", profile.level)
    .eq("power", profile.power)
    .in("clase", ["Base", profile.clase])
    .order("level");

    return habilities ? habilities : [];
  } 

  // Function to update user's habilities
  async updateHabilities(habilities: Hability[]) {
    try {
      let { data: habilitiesUpdated, error } = await this.supabase
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
      await this.supabase
      .from('habilities')
      .upsert(hability)
      .select('*');

    } catch(error) {
      console.error(error);
    }
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  public signOut() : any {
    return this.supabase.auth.signOut()
  }

  // Had to fix this manually to work
  async updateProfile(profile: Profile) {

    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return await this.supabase
    .from('profiles')
    .upsert(update)
    .select()
  }


  async updateProfileStats(profile: Profile) {
      
      const update = {
        ...profile,
        updated_at: new Date(),
      }
  
      return await this.supabase
      .from('profiles')
      .upsert(update)
      .select(`current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
  }
  

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({
      email: email,
      password: password,
    });
  }

  async insertProfile(profile: Profile) {
    return await this.supabase
    .from('profiles')
    .insert(profile)
    .select();
  }

  async upsertProfile(profile: Profile) {
    return await this.supabase
    .from('profiles')
    .upsert(profile)
    .select();
  }

  public async getEnemies() {
    return await this.supabase
    .from('enemies')
    .select('*');
  }

  public async getBroadcastBattleChannel() : Promise<RealtimeChannel> {
    const channel = this.supabase.channel('battle-channel-room');

    return channel;
  }

}