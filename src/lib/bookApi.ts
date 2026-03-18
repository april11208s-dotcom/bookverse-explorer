import axios from "axios";
import { BookData } from "@/components/BookCard";

/**
 * Fetch the description/synopsis for a book from Open Library Works API.
 * Falls back through multiple fields to maximize coverage.
 */
async function fetchDescription(workKey: string): Promise<string> {
  try {
    const res = await axios.get(`https://openlibrary.org${workKey}.json`, { timeout: 5000 });
    const data = res.data;

    // Description can be a string or an object { type, value }
    if (data.description) {
      if (typeof data.description === "string") return data.description;
      if (data.description.value) return data.description.value;
    }

    // Fallback: first_sentence
    if (data.first_sentence) {
      if (typeof data.first_sentence === "string") return data.first_sentence;
      if (data.first_sentence.value) return data.first_sentence.value;
    }

    // Fallback: excerpts
    if (data.excerpts?.[0]?.excerpt) return data.excerpts[0].excerpt;

    return "";
  } catch {
    return "";
  }
}

/**
 * Search books by title, author, or any query.
 */
export async function searchBooks(query: string): Promise<BookData[]> {
  const res = await axios.get(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count`
  );

  const docs = res.data.docs.slice(0, 20);

  // Fetch descriptions in parallel for all books
  const booksWithDescriptions = await Promise.all(
    docs.map(async (book: any) => {
      const workKey = book.key; // e.g., /works/OL12345W
      let description = book.first_sentence?.[0] || "";

      // If no first_sentence, fetch from works API
      if (!description && workKey) {
        description = await fetchDescription(workKey);
      }

      // Truncate very long descriptions
      if (description.length > 500) {
        description = description.substring(0, 497) + "...";
      }

      return {
        title: book.title,
        author: book.author_name?.[0] || "Desconocido",
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        description: description || "Sinopsis no disponible para este título.",
      };
    })
  );

  return booksWithDescriptions;
}

/**
 * Search books by subject/description.
 * Uses Open Library's subject search for more relevant results
 * when the user describes what they want to read.
 */
export async function searchByDescription(description: string): Promise<BookData[]> {
  // Use the regular search with the description - Open Library handles natural language well
  // Also try subject-based search for better results
  const [searchRes, subjectRes] = await Promise.allSettled([
    axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(description)}&limit=12&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count`
    ),
    axios.get(
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(description)}&limit=12&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  // Merge results, preferring subject matches, deduplicating by title
  for (const result of [subjectRes, searchRes]) {
    if (result.status === "fulfilled") {
      for (const doc of result.value.data.docs) {
        const key = doc.title?.toLowerCase();
        if (key && !seenTitles.has(key)) {
          seenTitles.add(key);
          allDocs.push(doc);
        }
      }
    }
  }

  const top20 = allDocs.slice(0, 20);

  // Fetch descriptions in parallel
  const booksWithDescriptions = await Promise.all(
    top20.map(async (book: any) => {
      const workKey = book.key;
      let bookDescription = book.first_sentence?.[0] || "";

      if (!bookDescription && workKey) {
        bookDescription = await fetchDescription(workKey);
      }

      if (bookDescription.length > 500) {
        bookDescription = bookDescription.substring(0, 497) + "...";
      }

      return {
        title: book.title,
        author: book.author_name?.[0] || "Desconocido",
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        description: bookDescription || "Sinopsis no disponible para este título.",
      };
    })
  );

  return booksWithDescriptions;
}

/**
 * Fetch trending / new books from Open Library's trending API.
 */
export async function fetchTrendingBooks(): Promise<BookData[]> {
  const res = await axios.get(
    `https://openlibrary.org/trending/daily.json?limit=20`
  );

  const works = res.data.works?.slice(0, 20) || [];

  const books = await Promise.all(
    works.map(async (work: any) => {
      const workKey = work.key; // e.g. /works/OL123W
      let description = "";

      if (workKey) {
        description = await fetchDescription(workKey);
      }

      if (description.length > 500) {
        description = description.substring(0, 497) + "...";
      }

      return {
        title: work.title,
        author: work.author_name?.[0] || "Desconocido",
        cover: work.cover_i
          ? `https://covers.openlibrary.org/b/id/${work.cover_i}-L.jpg`
          : null,
        description: description || "Sinopsis no disponible para este título.",
      };
    })
  );

  return books;
}
