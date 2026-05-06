import axios from "axios";
import { BookData } from "@/components/BookCard";
import { supabase } from "@/integrations/supabase/client";

const SEARCH_TIMEOUT_MS = 8000;
const DESCRIPTION_TIMEOUT_MS = 3500;
const AI_TIMEOUT_MS = 6000;
const MAX_DESCRIPTION_FETCHES = 8;
const MIN_RESULTS_WITH_COVERS = 6;

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

/**
 * Fetch books from Google Books API and convert them into the same shape
 * used by Open Library docs so they can be merged seamlessly.
 */
async function fetchGoogleBooksDocs(query: string, limit = 20): Promise<any[]> {
  try {
    const url = `${GOOGLE_BOOKS_ENDPOINT}?q=${encodeURIComponent(query)}&maxResults=${Math.min(limit, 40)}&printType=books&orderBy=relevance`;
    const response = await axios.get(url, { timeout: SEARCH_TIMEOUT_MS });
    const items = Array.isArray(response.data?.items) ? response.data.items : [];
    return items.map((item: any) => {
      const info = item.volumeInfo || {};
      const cover =
        info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail ||
        info.imageLinks?.smallThumbnail ||
        null;
      return {
        key: `/works/google_${item.id}`,
        title: info.title || "",
        author_name: info.authors || [],
        cover_i: null,
        _googleCover: cover ? cover.replace(/^http:/, "https:") : null,
        _googleDescription: info.description || "",
        first_sentence: info.description ? [info.description] : undefined,
        subject: info.categories || [],
        edition_count: 1,
        first_publish_year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) || 0 : 0,
      };
    });
  } catch {
    return [];
  }
}

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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
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
  "America Rodas",
  "América Rodas",
  "George R. R. Martin",
  "Brandon Sanderson",
  "Patrick Rothfuss",
  "Joe Abercrombie",
];

/**
 * Specific must-have sagas/books to surface in trending and prioritise.
 */
const FEATURED_SAGAS = [
  "A Game of Thrones",
  "A Clash of Kings",
  "A Storm of Swords",
  "A Feast for Crows",
  "A Dance with Dragons",
  "A Song of Ice and Fire",
  "Fire and Blood",
];

const QUERY_ALIASES: Record<string, string[]> = {
  fantasia: ["fantasy", "fantasía", "romantasy", "young adult fantasy"],
  "juego de tronos": ["A Game of Thrones", "Game of Thrones", "A Song of Ice and Fire", "George R. R. Martin"],
  "game of thrones": ["A Game of Thrones", "A Song of Ice and Fire", "George R. R. Martin"],
  "cancion de hielo y fuego": ["A Song of Ice and Fire", "A Game of Thrones", "George R. R. Martin"],
  "canción de hielo y fuego": ["A Song of Ice and Fire", "A Game of Thrones", "George R. R. Martin"],
};

function expandQueries(query: string): string[] {
  const normalized = normalizeText(query);
  const aliases = Object.entries(QUERY_ALIASES).flatMap(([key, values]) =>
    normalized.includes(key) ? values : []
  );

  return Array.from(new Set([query, ...aliases]));
}

function dedupeDocs(docs: any[]): any[] {
  const uniqueDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const doc of docs) {
    const cleanedTitle = cleanTitle(doc.title || "").toLowerCase();
    if (cleanedTitle && !seenTitles.has(cleanedTitle)) {
      seenTitles.add(cleanedTitle);
      uniqueDocs.push(doc);
    }
  }

  return uniqueDocs;
}

function isFeaturedSagaTitle(title: string): boolean {
  const normalizedTitle = normalizeText(cleanTitle(title));
  return FEATURED_SAGAS.some((saga) => normalizedTitle.includes(normalizeText(saga)));
}

function getBoostScore(doc: any, query: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(doc.title || "");
  const normalizedAuthor = normalizeText(doc.author_name?.[0] || "");

  let score = doc.edition_count || 0;

  if (CURATED_AUTHORS.some((author) => normalizedAuthor.includes(normalizeText(author)))) {
    score += 10000;
  }

  if (isFeaturedSagaTitle(normalizedTitle)) {
    score += 15000;
  }

  if (
    normalizedQuery.includes("juego de tronos") ||
    normalizedQuery.includes("game of thrones") ||
    normalizedQuery.includes("hielo y fuego")
  ) {
    if (
      normalizedAuthor.includes("george r. r. martin") ||
      normalizedTitle.includes("game of thrones") ||
      normalizedTitle.includes("song of ice and fire") ||
      normalizedTitle.includes("choque de reyes") ||
      normalizedTitle.includes("storm of swords")
    ) {
      score += 25000;
    }
  }

  if (normalizedQuery.includes("fantasia") || normalizedQuery.includes("fantasy")) {
    if (
      normalizedAuthor.includes("brandon sanderson") ||
      normalizedAuthor.includes("laura gallego") ||
      normalizedAuthor.includes("holly black") ||
      normalizedAuthor.includes("patrick rothfuss") ||
      normalizedAuthor.includes("george r. r. martin")
    ) {
      score += 12000;
    }
  }

  return score;
}

function processBooks(docs: any[], query = ""): any[] {
  const sorted = [...docs].sort((a, b) => getBoostScore(b, query) - getBoostScore(a, query));
  const withCover = sorted.filter((d: any) => d.cover_i);

  return withCover.length >= MIN_RESULTS_WITH_COVERS ? withCover : sorted;
}

async function fetchMergedDocs(
  queries: string[],
  builders: Array<(query: string) => string>
): Promise<any[]> {
  const results = await Promise.all(
    queries.flatMap((query) => builders.map((builder) => fetchDocs(builder(query))))
  );

  return dedupeDocs(results.flat());
}

async function fetchFantasyFallbackDocs(): Promise<any[]> {
  const fallbackQueries = [
    ...FEATURED_SAGAS,
    "George R. R. Martin",
    "Brandon Sanderson",
    "Laura Gallego",
    "Holly Black",
  ];

  return fetchMergedDocs(fallbackQueries, [
    (query) =>
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&sort=editions&limit=6&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
    (query) =>
      `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&sort=editions&limit=6&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
  ]);
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
          : book._googleCover || null,
        description: description || "",
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
  const queries = expandQueries(authorName);
  const olDocs = await fetchMergedDocs(queries, [
    (query) =>
      `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&sort=new&limit=40&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
    (query) =>
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=new&limit=20&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
  ]);
  const googleDocs = (
    await Promise.all(queries.map((q) => fetchGoogleBooksDocs(`inauthor:${q}`, 20)))
  ).flat();
  const allDocs = dedupeDocs([...olDocs, ...googleDocs]);

  allDocs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
  return docsToBooks(processBooks(allDocs, authorName).slice(0, 25));
}

/**
 * Search books by title, author, or any query.
 */
export async function searchBooks(query: string): Promise<BookData[]> {
  const queries = expandQueries(query);
  const normalizedQuery = normalizeText(query);

  let allDocs = await fetchMergedDocs(queries, [
    (value) =>
      `https://openlibrary.org/search.json?q=${encodeURIComponent(value)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
    (value) =>
      `https://openlibrary.org/search.json?title=${encodeURIComponent(value)}&sort=editions&limit=20&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
  ]);

  const googleDocs = (
    await Promise.all(queries.map((q) => fetchGoogleBooksDocs(q, 20)))
  ).flat();
  allDocs = dedupeDocs([...allDocs, ...googleDocs]);

  if (
    normalizedQuery.includes("juego de tronos") ||
    normalizedQuery.includes("game of thrones") ||
    normalizedQuery.includes("hielo y fuego")
  ) {
    const sagaDocs = await fetchFantasyFallbackDocs();
    allDocs = dedupeDocs([...sagaDocs, ...allDocs]);
  }

  return docsToBooks(processBooks(allDocs, query).slice(0, 20));
}

/**
 * Search books by subject/description.
 * Uses Open Library's subject search for more relevant results.
 */
export async function searchByDescription(description: string): Promise<BookData[]> {
  const queries = expandQueries(description);
  const normalizedDescription = normalizeText(description);

  let allDocs = await fetchMergedDocs(queries, [
    (query) =>
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
    (query) =>
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(query)}&sort=editions&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`,
  ]);

  if (
    !allDocs.length ||
    normalizedDescription.includes("fantasia") ||
    normalizedDescription.includes("fantasy")
  ) {
    const fallbackDocs = await fetchFantasyFallbackDocs();
    allDocs = dedupeDocs([...fallbackDocs, ...allDocs]);
  }

  const filtered = processBooks(allDocs, description).slice(0, 25);

  if (!filtered.length) {
    return [];
  }

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
  const requests = [
    ...CURATED_AUTHORS.flatMap((author) => [
      fetchDocs(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&sort=new&limit=8&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
      ),
      fetchDocs(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(author)}&sort=new&limit=6&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
      ),
    ]),
    ...FEATURED_SAGAS.map((saga) =>
      fetchDocs(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(saga)}&sort=editions&limit=4&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
      )
    ),
  ];

  const results = await Promise.all(requests);
  const allDocs = dedupeDocs(results.flat());
  allDocs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));

  return docsToBooks(processBooks(allDocs, "fantasia").slice(0, 50));
}
