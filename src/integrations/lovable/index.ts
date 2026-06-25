import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "@/integrations/supabase/client";

const lovableAuth = createLovableAuth();

export const lovable = {
  auth: {
    async signInWithOAuth(
      provider: "google" | "apple",
      options?: { redirect_uri?: string },
    ) {
      const result = await lovableAuth.signInWithOAuth(provider, options);

      if (result.redirected) {
        return { error: null, redirected: true as const };
      }

      if (result.error) {
        return { error: result.error, redirected: false as const };
      }

      if (result.tokens) {
        const { error } = await supabase.auth.setSession(result.tokens);
        if (error) {
          return { error, redirected: false as const };
        }
      }

      return { error: null, redirected: false as const };
    },
  },
};
