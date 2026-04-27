import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPreferences {
  favorite_genres: string[];
  favorite_tones: string[];
  favorite_tropes: string[];
  preferred_pace: string | null;
  preferred_length: string | null;
  favorite_authors: string[];
  onboarding_completed: boolean;
}

const empty: UserPreferences = {
  favorite_genres: [],
  favorite_tones: [],
  favorite_tropes: [],
  preferred_pace: null,
  preferred_length: null,
  favorite_authors: [],
  onboarding_completed: false,
};

export const usePreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPrefs(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_preferences")
      .select("favorite_genres, favorite_tones, favorite_tropes, preferred_pace, preferred_length, favorite_authors, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    setPrefs(data ?? empty);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async (next: Partial<UserPreferences>) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_preferences")
      .update(next)
      .eq("user_id", user.id);
    if (!error) {
      setPrefs((p) => ({ ...(p ?? empty), ...next }));
    }
    return error;
  };

  return { prefs, loading, save, refresh };
};