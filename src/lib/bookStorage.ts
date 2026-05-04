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

// ===== Personal Library =====
export type LibraryStatus = "liked" | "read";

export interface LibraryEntry {
  book: { title: string; author: string; cover: string | null; description: string };
  status: LibraryStatus;
  addedAt: string;
}

const LIB_KEY = "library";

export function getLibrary(): LibraryEntry[] {
  return JSON.parse(localStorage.getItem(LIB_KEY) || "[]");
}

export function getLibraryEntry(bookId: string): LibraryEntry | null {
  return getLibrary().find((e) => generateBookId(e.book.title) === bookId) || null;
}

export function setLibraryStatus(
  book: LibraryEntry["book"],
  status: LibraryStatus | null,
): void {
  let lib = getLibrary().filter((e) => e.book.title !== book.title);
  if (status) {
    lib.unshift({ book, status, addedAt: new Date().toISOString() });
  }
  localStorage.setItem(LIB_KEY, JSON.stringify(lib));
}

export function getLibraryStatus(bookTitle: string): LibraryStatus | null {
  const e = getLibrary().find((x) => x.book.title === bookTitle);
  return e?.status ?? null;
}

// Personal notes (separate from public reviews)
export interface PersonalNote {
  text: string;
  rating: number;
  updatedAt: string;
}

export function getPersonalNote(bookId: string): PersonalNote | null {
  const all: Record<string, PersonalNote> = JSON.parse(
    localStorage.getItem("personalNotes") || "{}",
  );
  return all[bookId] || null;
}

export function savePersonalNote(bookId: string, note: Omit<PersonalNote, "updatedAt">): void {
  const all: Record<string, PersonalNote> = JSON.parse(
    localStorage.getItem("personalNotes") || "{}",
  );
  all[bookId] = { ...note, updatedAt: new Date().toISOString() };
  localStorage.setItem("personalNotes", JSON.stringify(all));
}
