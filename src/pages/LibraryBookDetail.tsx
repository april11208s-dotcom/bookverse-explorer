import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Heart, CheckCircle2, Save } from "lucide-react";
import StarRating from "@/components/StarRating";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nContext";
import {
  generateBookId,
  getLibraryEntry,
  setLibraryStatus,
  getPersonalNote,
  savePersonalNote,
  type LibraryEntry,
} from "@/lib/bookStorage";
import { toast } from "@/hooks/use-toast";

const LibraryBookDetail = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<LibraryEntry | null>(null);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const e = getLibraryEntry(id);
    if (!e) {
      // fallback: try sessionStorage book
      const cached = sessionStorage.getItem("currentBook");
      if (cached) {
        const book = JSON.parse(cached);
        if (generateBookId(book.title) === id) {
          setEntry({ book, status: "liked", addedAt: new Date().toISOString() });
        } else {
          navigate("/library");
        }
      } else {
        navigate("/library");
      }
      return;
    }
    setEntry(e);
    const note = getPersonalNote(id);
    if (note) {
      setText(note.text);
      setRating(note.rating);
      setUpdatedAt(note.updatedAt);
    }
  }, [id, navigate]);

  if (!entry || !id) return null;

  const handleSave = () => {
    savePersonalNote(id, { text: text.trim(), rating });
    setUpdatedAt(new Date().toISOString());
    toast({ title: t("note.saved") });
  };

  const setStatus = (s: "liked" | "read") => {
    setLibraryStatus(entry.book, s);
    setEntry({ ...entry, status: s });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/library")}
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("detail.back")}
          </button>
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-display text-2xl text-primary">BOOKFLIX</span>
          <div className="ml-auto"><LanguageToggle /></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 md:flex-row">
          <div className="mx-auto w-56 flex-shrink-0 md:mx-0">
            {entry.book.cover ? (
              <img src={entry.book.cover} alt={entry.book.title} className="w-full rounded-lg shadow-[var(--shadow-card)]" />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-secondary">
                <span className="p-4 text-center font-display text-2xl text-muted-foreground">{entry.book.title}</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h1 className="font-display text-4xl text-foreground md:text-5xl">{entry.book.title.toUpperCase()}</h1>
              <p className="mt-1 text-muted-foreground">{entry.book.author}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatus("liked")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  entry.status === "liked"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground hover:border-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${entry.status === "liked" ? "fill-current" : ""}`} />
                {t("lib.markLiked")}
              </button>
              <button
                onClick={() => setStatus("read")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  entry.status === "read"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground hover:border-primary"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("lib.markRead")}
              </button>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-2xl text-foreground">{t("note.heading")}</h2>
              <div>
                <span className="mb-1 block text-xs text-muted-foreground">{t("note.rating")}</span>
                <StarRating rating={rating} onRate={setRating} />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={t("note.placeholder")}
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="flex items-center justify-between">
                {updatedAt ? (
                  <span className="text-xs text-muted-foreground">
                    {t("note.updated")}: {new Date(updatedAt).toLocaleString(lang === "en" ? "en-US" : "es-ES")}
                  </span>
                ) : <span />}
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
                >
                  <Save className="h-4 w-4" />
                  {t("note.save")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LibraryBookDetail;
