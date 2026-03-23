import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, User } from "lucide-react";
import StarRating from "./StarRating";
import { Review, addReview, getReviews } from "@/lib/bookStorage";

interface ReviewSectionProps {
  bookId: string;
}

const ReviewSection = ({ bookId }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>(() => getReviews(bookId));
  const [authorName, setAuthorName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !authorName.trim() || reviewRating === 0) return;

    const newReview = addReview(bookId, {
      author: authorName.trim(),
      text: reviewText.trim(),
      rating: reviewRating,
    });
    setReviews([newReview, ...reviews]);
    setAuthorName("");
    setReviewText("");
    setReviewRating(0);
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h3 className="font-display text-3xl text-foreground">RESEÑAS</h3>
        {averageRating && (
          <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
            ★ {averageRating} ({reviews.length})
          </span>
        )}
      </div>

      {/* Write review form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-secondary p-4">
        <p className="text-sm font-medium text-foreground">Escribe tu reseña</p>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Tu nombre"
            className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">Tu puntuación:</span>
          <StarRating rating={reviewRating} onRate={setReviewRating} />
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="¿Qué te pareció este libro?"
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!reviewText.trim() || !authorName.trim() || reviewRating === 0}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          Publicar reseña
        </button>
      </form>

      {/* Reviews list */}
      <AnimatePresence>
        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sé el primero en dejar una reseña sobre este libro.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {review.author[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-star-active">{"★".repeat(review.rating)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-secondary-foreground">{review.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewSection;
