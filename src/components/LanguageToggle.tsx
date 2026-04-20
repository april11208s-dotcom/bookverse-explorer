import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const LanguageToggle = () => {
  const { lang, setLang, t } = useI18n();
  const next = lang === "es" ? "en" : "es";
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={t("lang.label")}
      title={t("lang.label")}
      className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-xs font-semibold uppercase tracking-wide text-secondary-foreground transition-all hover:border-primary hover:text-primary"
    >
      <Languages className="h-4 w-4" />
      {next.toUpperCase()}
    </button>
  );
};

export default LanguageToggle;
