import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Heart, CheckCircle2, Trash2 } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nContext";
import {
  getLibrary,
  setLibraryStatus,
  generateBookId,
  type LibraryEntry,
  type LibraryStatus,
} from "@/lib/bookStorage";

const Library = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [filter, setFilter] = useState<LibraryStatus | "all">("all");

  useEffect(() => {
    setEntries(getLibrary());
  }, []);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter);

  const remove = (title: string, book: LibraryEntry["book"]) => {
    setLibraryStatus(book, null);
    setEntries(getLibrary());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("detail.back")}
          </button>
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl text-primary">BOOKFLIX</span>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-display text-5xl text-foreground">{t("lib.title")}</h1>

        <div className="mb-6 flex gap-2">
          {([
            { k: "all", label: t("lib.all") },
            { k: "liked", label: t("lib.liked") },
            { k: "read", label: t("lib.read") },
          ] as const).map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as any)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === f.k
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">{t("lib.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((e, i) => {
              const id = generateBookId(e.book.title);
              return (
                <motion.div
                  key={e.book.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative cursor-pointer overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] transition-all hover:scale-105 hover:shadow-[var(--shadow-card-hover)]"
                  onClick={() => {
                    sessionStorage.setItem("currentBook", JSON.stringify(e.book));
                    navigate(`/library/${id}`);
                  }}
                >
                  <div className="aspect-[2/3] overflow-hidden bg-secondary">
                    {e.book.cover ? (
                      <img src={e.book.cover} alt={e.book.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3">
                        <span className="text-center font-display text-xl text-muted-foreground">{e.book.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs">
                    {e.status === "liked" ? (
                      <><Heart className="h-3 w-3 fill-primary text-primary" /> {t("lib.liked")}</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3 text-primary" /> {t("lib.read")}</>
                    )}
                  </div>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); remove(e.book.title, e.book); }}
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-foreground">{e.book.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">{e.book.author}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;
