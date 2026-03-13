import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";
import { Heart } from "lucide-react";

export interface BookData {
  title: string;
  author: string;
  cover: string | null;
  description: string;
}

interface BookCardProps {
  book: BookData;
  index: number;
}

const BookCard = ({ book, index }: BookCardProps) => {
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const savedBooks: BookData[] = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (savedBooks.find((b) => b.title === book.title)) {
      setSaved(true);
    }
    const ratings: Record<string, number> = JSON.parse(localStorage.getItem("ratings") || "{}");
    if (ratings[book.title]) {
      setRating(ratings[book.title]);
    }
  }, [book.title]);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    let savedBooks: BookData[] = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (saved) {
      savedBooks = savedBooks.filter((b) => b.title !== book.title);
    } else {
      savedBooks.push(book);
    }
    localStorage.setItem("favorites", JSON.stringify(savedBooks));
    setSaved(!saved);
  };

  const handleRate = (star: number) => {
    setRating(star);
    const ratings: Record<string, number> = JSON.parse(localStorage.getItem("ratings") || "{}");
    ratings[book.title] = star;
    localStorage.setItem("ratings", JSON.stringify(ratings));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-105">
        {/* Cover */}
        <div className="aspect-[2/3] overflow-hidden bg-secondary">
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-center font-display text-2xl text-muted-foreground">
                {book.title}
              </span>
            </div>
          )}
        </div>

        {/* Save button overlay */}
        <button
          onClick={toggleSave}
          className={`absolute top-2 right-2 rounded-full p-2 transition-all ${
            saved
              ? "bg-primary text-primary-foreground"
              : "bg-background/70 text-muted-foreground hover:text-primary"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>

        {/* Info */}
        <div className="p-3">
          <h3 className="truncate text-sm font-semibold text-foreground">{book.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{book.author}</p>
          <div className="mt-2">
            <StarRating rating={rating} onRate={handleRate} />
          </div>
        </div>
      </div>

      {/* Expanded synopsis */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg bg-card p-4 shadow-[var(--shadow-card-hover)]"
        >
          <p className="text-sm leading-relaxed text-secondary-foreground">{book.description}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookCard;
