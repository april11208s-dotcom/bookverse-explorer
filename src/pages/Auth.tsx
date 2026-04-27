import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nContext";
import LanguageToggle from "@/components/LanguageToggle";
import { toast } from "sonner";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);
const nameSchema = z.string().trim().min(1).max(60);

const Auth = () => {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const emailParsed = emailSchema.safeParse(email);
      const passParsed = passwordSchema.safeParse(password);
      if (!emailParsed.success) {
        toast.error("Email inválido");
        return;
      }
      if (!passParsed.success) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      if (mode === "signup") {
        const nameParsed = nameSchema.safeParse(displayName);
        if (!nameParsed.success) {
          toast.error("Introduce tu nombre");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: emailParsed.data,
          password: passParsed.data,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: nameParsed.data },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailParsed.data,
          password: passParsed.data,
        });
        if (error) throw error;
      }
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.errorGeneric");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl text-primary">BOOKFLIX</h1>
        </div>
        <LanguageToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-secondary/30 p-8 shadow-2xl backdrop-blur"
        >
          <h2 className="mb-2 text-center font-display text-4xl text-foreground">
            {t("auth.title")}
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {t("auth.subtitle")}
          </p>

          <div className="mb-6 flex rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("auth.signUp")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t("auth.signIn")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">{t("auth.displayName")}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  required
                  maxLength={60}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                required
                maxLength={255}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                required
                minLength={6}
                maxLength={72}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? t("auth.loading") : mode === "signup" ? t("auth.signUpBtn") : t("auth.signInBtn")}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;