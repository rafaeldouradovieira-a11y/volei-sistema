import type { Profile } from "@/lib/supabase/types";

export function isProfileComplete(profile: Profile | null | undefined): boolean {
  return (
    !!profile &&
    profile.age != null &&
    profile.height_cm != null &&
    profile.weight_kg != null &&
    !!profile.gender &&
    !!profile.avatar_url
  );
}
