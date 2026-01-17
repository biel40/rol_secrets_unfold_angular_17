# Rol Secrets Unfold - Improvement Ideas

## Quick Observations
- Supabase-driven auth, profiles, items, habilities, enemies, NPCs, missions.
- Admin area exists, but there are no explicit route guards.
- UI relies on Angular Material + Tailwind + custom SCSS.
- Realtime battle notifications are already wired in.

## Product Improvements (Short-Term)
- Replace browser alerts in auth with snackbars for consistent UX.
- Add route guards for signed-in users and admin-only access.
- Add empty states and inline loading indicators in profile tabs.
- Show last update timestamps for profile stats and inventory.
- Add image upload and crop for profile avatars.
- Add safe retry and offline error messages for Supabase calls.

## UX and UI Improvements
- Provide a global top bar with user menu, language switcher, and quick actions.
- Add a profile progress summary (XP bar, next level goals, stat deltas).
- Introduce keyboard shortcuts for common actions (save, switch tab).
- Improve mobile navigation with a bottom tab bar.
- Add visual badges for rare items and elite habilities.

## Data and Architecture Improvements
- Centralize API error handling in SupabaseService.
- Add typed response models and narrow any usage.
- Cache profile data with RxJS and invalidate on updates.
- Add server-side row-level security policies review checklist.
- Add audit logs for admin actions.

## New Feature Ideas
- Quest board with assignments, rewards, and completion flow (missions already modeled).
- NPC directory with relationship notes and encounter history.
- Party management: create groups, share inventory, track party buffs.
- Battle history log with outcome stats, loot, and notes.
- Equipment slots with bonuses and set effects.
- Crafting system for items and consumables.
- GM tools: random encounter generator, dice log, quick enemy spawner.
- Social: profile sharing link, invite codes, and party chat.
- PWA mode with offline profile access and sync queue.
- Push notifications for battle start and mission updates.

## Quality and Testing
- Add unit tests for services and key components.
- Add e2e smoke tests for auth and profile flows.
