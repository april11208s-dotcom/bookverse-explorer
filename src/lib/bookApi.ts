import axios from "axios";
import { BookData } from "@/components/BookCard";
import { supabase } from "@/integrations/supabase/client";

const SEARCH_TIMEOUT_MS = 8000;
const DESCRIPTION_TIMEOUT_MS = 3500;
const AI_TIMEOUT_MS = 6000;
const MAX_DESCRIPTION_FETCHES = 8;

/**
 * Clean book titles by removing edition/format noise like
 * "Hardcover", "Box Set", "Paperback", etc.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(.*?(hardcover|paperback|box\s*set|edition|reprint|anniversary|deluxe|collector|omnibus|bind-up|mass\s*market).*?\)/gi, "")
    .replace(/\s*\[.*?(hardcover|paperback|box\s*set|edition).*?\]/gi, "")
    .replace(/\s*[-–:]\s*(hardcover|paperback|box\s*set|a novel|the novel|the complete|complete collection).*$/gi, "")
    .replace(/\s*(hardcover|paperback|box\s*set)$/gi, "")
    .trim();
}

function getFirstSentence(book: any): string {
  if (typeof book?.first_sentence === "string") return book.first_sentence;
  if (Array.isArray(book?.first_sentence) && typeof book.first_sentence[0] === "string") {
    return book.first_sentence[0];
  }
  if (typeof book?.first_sentence?.value === "string") return book.first_sentence.value;
  return "";
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), ms);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(null);
      });
  });
}

async function fetchDocs(url: string): Promise<any[]> {
  try {
    const response = await axios.get(url, { timeout: SEARCH_TIMEOUT_MS });
    return Array.isArray(response.data?.docs) ? response.data.docs : [];
  } catch {
    return [];
  }
}

/**
 * Fetch the description/synopsis for a book from Open Library Works API.
 * Falls back through multiple fields to maximize coverage.
 */
async function fetchDescription(workKey: string): Promise<string> {
  try {
    const res = await axios.get(`https://openlibrary.org${workKey}.json`, {
      timeout: DESCRIPTION_TIMEOUT_MS,
    });
    const data = res.data;

    if (data.description) {
      if (typeof data.description === "string") return data.description;
      if (data.description.value) return data.description.value;
    }

    if (data.first_sentence) {
      if (typeof data.first_sentence === "string") return data.first_sentence;
      if (data.first_sentence.value) return data.first_sentence.value;
    }

    if (data.excerpts?.[0]?.excerpt) return data.excerpts[0].excerpt;

    return "";
  } catch {
    return "";
  }
}

/**
 * Curated YA/romance/fantasy authors to boost in search results.
 */
const CURATED_AUTHORS = [
  "Sarah J. Maas",
  "Rebecca Yarros",
  "Lauren Roberts",
  "Jennifer L. Armentrout",
  "Stephanie Garber",
  "Holly Black",
  "Leigh Bardugo",
  "Sabaa Tahir",
  "Samantha Shannon",
  "SA Chakraborty",
  "Madeline Miller",
  "Tamsyn Muir",
  "Lily Mayne",
  "Laura Gallego",
  "Victoria Álvarez",
  "Sara Barquinero",
  "Andrea Abreu",
  "Layla Martínez",
  "María Martínez",
  "Andrea Longarela",
  "Tamara Molina",
  "Adriana Criado",
  "Irene Franco",
  "Paula Ramos",
  "Irina Suoma",
  "Joana Marcús",
  "Mercedes Ron",
  "Inma Rubiales",
  "Eloy Moreno",
  "Chloe Walsh",
  "Care Santos",
  "Iria G. Parente",
  "Selene M. Pascual",
  // Fantasía épica
  "George R. R. Martin",
  "Brandon Sanderson",
  "Patrick Rothfuss",
  "Joe Abercrombie",
];

/**
 * Specific must-have sagas/books to surface in trending and prioritise.
 */
const FEATURED_SAGAS = [
  "A Song of Ice and Fire",
  "Game of Thrones",
  "A Clash of Kings",
  "A Storm of Swords",
  "A Feast for Crows",
  "A Dance with Dragons",
  "Fire and Blood",
];

function processBooks(docs: any[]): any[] {
  return docs
    .filter((d: any) => d.cover_i)
    .sort((a: any, b: any) => (b.edition_count || 0) - (a.edition_count || 0));
}

async function docsToBooks(docs: any[]): Promise<BookData[]> {
  const keysNeedingDescription = new Set(
    docs
      .filter((book: any) => !getFirstSentence(book) && book.key)
      .slice(0, MAX_DESCRIPTION_FETCHES)
      .map((book: any) => book.key)
  );

  const results = await Promise.allSettled(
    docs.map(async (book: any) => {
      let description = getFirstSentence(book);

      if (!description && book.key && keysNeedingDescription.has(book.key)) {
        description = await fetchDescription(book.key);
      }

      if (description.length > 500) {
        description = `${description.substring(0, 497)}...`;
      }

      return {
        title: cleanTitle(book.title || "Sin título"),
        author: book.author_name?.[0] || "Desconocido",
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        description: description || "Sinopsis no disponible para este título.",
      } satisfies BookData;
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<BookData> => result.status === "fulfilled")
    .map((result) => result.value);
}

/**
 * Search books by author name.
 */
export async function searchByAuthor(authorName: string): Promise<BookData[]> {
  const [authorDocs, queryDocs] = await Promise.all([
    fetchDocs(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&sort=new&limit=40&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    fetchDocs(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(authorName)}&sort=new&limit=20&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const doc of [...authorDocs, ...queryDocs]) {
    const cleanedTitle = cleanTitle(doc.title || "").toLowerCase();
    if (cleanedTitle && !seenTitles.has(cleanedTitle)) {
      seenTitles.add(cleanedTitle);
      allDocs.push(doc);
    }
  }

  allDocs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));

  const filtered = processBooks(allDocs).slice(0, 25);
  return docsToBooks(filtered);
}

/**
 * Search books by title, author, or any query.
 */
export async function searchBooks(query: string): Promise<BookData[]> {
  const [mainDocs, authorDocs] = await Promise.all([
    fetchDocs(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    fetchDocs(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=editions&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const doc of [...authorDocs, ...mainDocs]) {
    const key = cleanTitle(doc.title || "").toLowerCase();
    if (key && !seenTitles.has(key)) {
      seenTitles.add(key);
      allDocs.push(doc);
    }
  }

  const boosted = allDocs.sort((a, b) => {
    const aIsCurated = CURATED_AUTHORS.some((ca) =>
      a.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );
    const bIsCurated = CURATED_AUTHORS.some((ca) =>
      b.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );

    if (aIsCurated && !bIsCurated) return -1;
    if (!aIsCurated && bIsCurated) return 1;
    return (b.edition_count || 0) - (a.edition_count || 0);
  });

  const filtered = processBooks(boosted).slice(0, 20);
  return docsToBooks(filtered);
}

/**
 * Search books by subject/description.
 * Uses Open Library's subject search for more relevant results.
 */
export async function searchByDescription(description: string): Promise<BookData[]> {
  const [searchDocs, subjectDocs] = await Promise.all([
    fetchDocs(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(description)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    fetchDocs(
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(description)}&sort=editions&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const doc of [...subjectDocs, ...searchDocs]) {
    const key = cleanTitle(doc.title || "").toLowerCase();
    if (key && !seenTitles.has(key)) {
      seenTitles.add(key);
      allDocs.push(doc);
    }
  }

  const boosted = allDocs.sort((a, b) => {
    const aIsCurated = CURATED_AUTHORS.some((ca) =>
      a.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );
    const bIsCurated = CURATED_AUTHORS.some((ca) =>
      b.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );

    if (aIsCurated && !bIsCurated) return -1;
    if (!aIsCurated && bIsCurated) return 1;
    return (b.edition_count || 0) - (a.edition_count || 0);
  });

  const filtered = processBooks(boosted).slice(0, 25);
  const booksForAI = filtered.map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0] || "Desconocido",
    description: getFirstSentence(doc),
    first_publish_year: doc.first_publish_year || null,
  }));

  const aiResponse = await withTimeout(
    supabase.functions.invoke("rank-books", {
      body: { userQuery: description, books: booksForAI },
    }),
    AI_TIMEOUT_MS
  );

  if (!aiResponse) {
    return docsToBooks(filtered.slice(0, 20));
  }

  const { data, error } = aiResponse;

  if (!error && data?.ranked) {
    const rankedDocs = data.ranked
      .filter((i: number) => i >= 0 && i < filtered.length)
      .map((i: number) => filtered[i]);

    return docsToBooks(rankedDocs.slice(0, 20));
  }

  return docsToBooks(filtered.slice(0, 20));
}

/**
 * Fetch curated YA books from popular authors in romance & fantasy.
 */
export async function fetchTrendingBooks(): Promise<BookData[]> {
  const requests = CURATED_AUTHORS.flatMap((author) => [
    fetchDocs(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&sort=new&limit=8&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    fetchDocs(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(author)}&sort=new&limit=6&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const results = await Promise.all(requests);
  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const docs of results) {
    for (const doc of docs) {
      const cleanedTitle = cleanTitle(doc.title || "").toLowerCase();
      if (cleanedTitle && !seenTitles.has(cleanedTitle) && doc.cover_i) {
        seenTitles.add(cleanedTitle);
        allDocs.push(doc);
      }
    }
  }

  allDocs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  return docsToBooks(allDocs.slice(0, 50));
}
