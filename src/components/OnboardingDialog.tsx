import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nContext";
import { usePreferences } from "@/hooks/usePreferences";
import { toast } from "sonner";

const GENRES = [
  "Romance", "Fantasía", "Romantasy", "Ciencia ficción", "Misterio",
  "Thriller", "Contemporáneo YA", "Histórico", "Distopía", "Paranormal",
];
const TONES = ["Oscuro", "Ligero", "Emocional", "Divertido", "Sensual", "Épico"];
const TROPES = [
  "Enemies to lovers", "Friends to lovers", "Slow burn", "Forbidden love",
  "Fake dating", "Second chance", "Grumpy x Sunshine", "Found family",
  "Brother's best friend", "Touch her and die",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const Chip = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-secondary text-secondary-foreground hover:border-primary/60"
    }`}
  >
    {label}
  </button>
);

const OnboardingDialog = ({ open, onClose }: Props) => {
  const { t } = useI18n();
  const { prefs, save } = usePreferences();
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState<string[]>(prefs?.favorite_genres ?? []);
  const [tones, setTones] = useState<string[]>(prefs?.favorite_tones ?? []);
  const [tropes, setTropes] = useState<string[]>(prefs?.favorite_tropes ?? []);
  const [pace, setPace] = useState<string | null>(prefs?.preferred_pace ?? null);
  const [length, setLength] = useState<string | null>(prefs?.preferred_length ?? null);
  const [authorsText, setAuthorsText] = useState((prefs?.favorite_authors ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  const TOTAL = 6;

  const toggle = (arr: string[], v: string, setter: (v: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const handleFinish = async () => {
    setSaving(true);
    const authors = authorsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    const err = await save({
      favorite_genres: genres,
      favorite_tones: tones,
      favorite_tropes: tropes,
      preferred_pace: pace,
      preferred_length: length,
      favorite_authors: authors,
      onboarding_completed: true,
    });
    setSaving(false);
    if (err) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    onClose();
  };

  const handleSkip = async () => {
    await save({ onboarding_completed: true });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl border-border bg-background">
        <div className="mb-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-primary">
            {t("onb.step", { n: String(step + 1), total: String(TOTAL) })}
          </p>
          <h2 className="font-display text-3xl text-foreground">{t("onb.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("onb.subtitle")}</p>
        </div>

        <div className="min-h-[260px] py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.genres")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => (
                      <Chip key={g} label={g} active={genres.includes(g)} onClick={() => toggle(genres, g, setGenres)} />
                    ))}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.tones")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((g) => (
                      <Chip key={g} label={g} active={tones.includes(g)} onClick={() => toggle(tones, g, setTones)} />
                    ))}
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.tropes")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {TROPES.map((g) => (
                      <Chip key={g} label={g} active={tropes.includes(g)} onClick={() => toggle(tropes, g, setTropes)} />
                    ))}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.pace")}</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { v: "slow", l: t("onb.pace.slow") },
                      { v: "medium", l: t("onb.pace.medium") },
                      { v: "fast", l: t("onb.pace.fast") },
                    ].map((o) => (
                      <Chip key={o.v} label={o.l} active={pace === o.v} onClick={() => setPace(o.v)} />
                    ))}
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.length")}</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { v: "short", l: t("onb.length.short") },
                      { v: "medium", l: t("onb.length.medium") },
                      { v: "long", l: t("onb.length.long") },
                    ].map((o) => (
                      <Chip key={o.v} label={o.l} active={length === o.v} onClick={() => setLength(o.v)} />
                    ))}
                  </div>
                </>
              )}
              {step === 5 && (
                <>
                  <h3 className="mb-4 text-lg font-medium text-foreground">{t("onb.q.authors")}</h3>
                  <textarea
                    value={authorsText}
                    onChange={(e) => setAuthorsText(e.target.value)}
                    placeholder={t("onb.authors.placeholder")}
                    rows={4}
                    maxLength={500}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("onb.skip")}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full border border-border px-5 py-2 text-sm text-foreground hover:bg-secondary"
              >
                {t("onb.back")}
              </button>
            )}
            {step < TOTAL - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                {t("onb.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                {saving ? t("auth.loading") : t("onb.finish")}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;