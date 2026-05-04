import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, BookOpen, CheckCircle2 } from "lucide-react";
import StarRating from "@/components/StarRating";
import ReviewSection from "@/components/ReviewSection";
import BookRecommendation from "@/components/BookRecommendation";
import { BookData } from "@/components/BookCard";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nContext";
import {
  generateBookId,
  getBookRating,
  setBookRating,
  isFavorite,
  toggleFavorite,
  setLibraryStatus,
  getLibraryStatus,
  type LibraryStatus,
} from "@/lib/bookStorage";

const BookDetail = () => {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("q");

  const [book, setBook] = useState<BookData | null>(null);
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [libStatus, setLibStatus] = useState<LibraryStatus | null>(null);

  useEffect(() => {
    // Try to find book from localStorage cache
    const cached = sessionStorage.getItem("currentBook");
    if (cached) {
      const parsed: BookData = JSON.parse(cached);
      if (id === generateBookId(parsed.title)) {
        setBook(parsed);
        setRating(getBookRating(parsed.title));
        setSaved(isFavorite(parsed.title));
        setLibStatus(getLibraryStatus(parsed.title));
        return;
      }
    }
    // If no match, go back
    navigate("/");
  }, [id, navigate]);

  if (!book) return null;

  const handleRate = (star: number) => {
    setRating(star);
    setBookRating(book.title, star);
  };

  const handleToggleFavorite = () => {
    const nowSaved = toggleFavorite(book);
    setSaved(nowSaved);
    if (nowSaved) {
      setLibraryStatus(book, "liked");
      setLibStatus("liked");
    } else if (getLibraryStatus(book.title) === "liked") {
      setLibraryStatus(book, null);
      setLibStatus(null);
    }
  };

  const handleMarkRead = () => {
    if (!book) return;
    const next = libStatus === "read" ? null : "read";
    setLibraryStatus(book, next);
    setLibStatus(next);
  };

  const bookId = generateBookId(book.title);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Book hero section */}
          <div className="mb-10 flex flex-col gap-8 md:flex-row">
            {/* Cover */}
            <div className="mx-auto w-64 flex-shrink-0 md:mx-0">
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full rounded-lg shadow-[var(--shadow-card)]"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-secondary shadow-[var(--shadow-card)]">
                  <span className="text-center font-display text-3xl text-muted-foreground p-4">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-5">
              <div>
                <h1 className="font-display text-5xl text-foreground md:text-6xl">
                  {book.title.toUpperCase()}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{book.author}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{t("detail.yourRating")}</span>
                <StarRating rating={rating} onRate={handleRate} />
              </div>

              {/* Favorite button */}
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  saved
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {saved ? t("detail.savedFav") : t("detail.saveFav")}
              </button>

              <button
                onClick={handleMarkRead}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  libStatus === "read"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("lib.markRead")}
              </button>

              {/* Synopsis */}
              <div>
                <h2 className="mb-2 font-display text-2xl text-foreground">{t("detail.synopsis")}</h2>
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  {book.description || t("detail.noSynopsis")}
                </p>
              </div>

              {/* AI Recommendation */}
              <BookRecommendation book={book} searchQuery={searchQuery} />
            </div>
          </div>

          {/* Reviews */}
          <ReviewSection bookId={bookId} />
        </motion.div>
      </main>
    </div>
  );
};

export default BookDetail;
