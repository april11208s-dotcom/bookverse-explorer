export interface Review {
  id: string;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export function getBookRating(bookId: string): number {
  const ratings: Record<string, number> = JSON.parse(localStorage.getItem("ratings") || "{}");
  return ratings[bookId] || 0;
}

export function setBookRating(bookId: string, rating: number): void {
  const ratings: Record<string, number> = JSON.parse(localStorage.getItem("ratings") || "{}");
  ratings[bookId] = rating;
  localStorage.setItem("ratings", JSON.stringify(ratings));
}

export function getReviews(bookId: string): Review[] {
  const allReviews: Record<string, Review[]> = JSON.parse(localStorage.getItem("reviews") || "{}");
  return allReviews[bookId] || [];
}

export function addReview(bookId: string, review: Omit<Review, "id" | "date">): Review {
  const allReviews: Record<string, Review[]> = JSON.parse(localStorage.getItem("reviews") || "{}");
  const newReview: Review = {
    ...review,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  allReviews[bookId] = [newReview, ...(allReviews[bookId] || [])];
  localStorage.setItem("reviews", JSON.stringify(allReviews));
  return newReview;
}

export function isFavorite(bookTitle: string): boolean {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favorites.some((b: any) => b.title === bookTitle);
}

export function toggleFavorite(book: { title: string; author: string; cover: string | null; description: string }): boolean {
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const exists = favorites.some((b: any) => b.title === book.title);
  if (exists) {
    favorites = favorites.filter((b: any) => b.title !== book.title);
  } else {
    favorites.push(book);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  return !exists;
}

export function generateBookId(title: string): string {
  return encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));
}
