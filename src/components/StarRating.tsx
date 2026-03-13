interface StarRatingProps {
  rating: number;
  onRate: (star: number) => void;
}

const StarRating = ({ rating, onRate }: StarRatingProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => {
            e.stopPropagation();
            onRate(star);
          }}
          className={`text-lg transition-transform hover:scale-125 ${
            star <= rating ? "text-star-active" : "text-star-inactive"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
