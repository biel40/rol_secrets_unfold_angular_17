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
    try {
      let profileInfo: any = this._supabaseClient
        .from('profiles')
        .select(`id, username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience, image_url`)
        .eq('id', userId)
        .single();

      return profileInfo;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  public async getAllHabilities() {
    let { data: habilities, error } = await this._supabaseClient
      .from('habilities')
      .select('*');

    return error ? error : habilities;
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

    if (habilities) {
      let habilitiesIds: string[] = habilities.map(hability => hability.hability_id);

      let { data: userHabilities, error } = await this._supabaseClient
        .from('habilities')
        .select('*')
        .in("id", habilitiesIds)
        .order("level");

      // First, we will filter the habilities that the user has by the level of the user and the power of the user
      // and the class of the user
      if (userHabilities) {
        userHabilities = userHabilities.filter(hability => hability.level <= profile.level && hability.power === profile.power && (hability.clase === profile.clase || hability.clase === 'Base'));
      }

      // We will set the current uses of the hability on the fly from the intermediate table
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
  public async updateHabilities(habilities: Hability[]) {
    try {
      let { data: habilitiesUpdated, error } = await this._supabaseClient
        .from('habilities')
        .upsert(habilities)
        .select('*');

      return error ? error : habilitiesUpdated;
    } catch (error) {
      return error;
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

  public async getEnemies() {
    return await this._supabaseClient
      .from('enemies')
      .select('*');
  }

  public async getBroadcastBattleChannel(): Promise<RealtimeChannel> {
    const channel = this._supabaseClient.channel('battle-channel-room');

    return channel;
  }

  public async getItems(userId: string) {
    return await this._supabaseClient
      .from('items')
      .select('*')
      .eq('profile_id', userId);
  }

  public async saveItemToProfile(item: Item) {

    if (item.id === 0) {
      // We will generate a random int to be the id of the item
      item.id = Math.floor(Math.random() * 1000000);
    }

    // We will insert the new item into the table items
    await this._supabaseClient
      .from('items')
      .insert(item)
      .select();
  }

  public async deleteItemFromProfile(item: Item) {
    await this._supabaseClient
      .from('items')
      .delete()
      .eq('id', item.id);
  }

  public async deleteEnemy(enemyId: string) {
    return await this._supabaseClient
      .from('enemies')
      .delete()
      .eq('id', enemyId);
  }

  // NPC methods for Supabase integration
  public async getNPCs() {
    return await this._supabaseClient
      .from('npcs')
      .select('*');
  }

  public async createNPC(npc: NPC) {
    return await this._supabaseClient
      .from('npcs')
      .insert(npc)
      .select();
  }

  public async updateNPC(npc: NPC) {
    return await this._supabaseClient
      .from('npcs')
      .update(npc)
      .eq('id', npc.id)
      .select();
  }

  public async deleteNPC(npcId: number) {
    return await this._supabaseClient
      .from('npcs')
      .delete()
      .eq('id', npcId);
  }
}