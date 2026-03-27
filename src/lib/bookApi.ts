import axios from "axios";
import { BookData } from "@/components/BookCard";
import { supabase } from "@/integrations/supabase/client";

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
 * Curated YA/romance/fantasy authors to boost in search results.
 */
const CURATED_AUTHORS = [
  "Sarah J. Maas", "Rebecca Yarros", "Lauren Roberts",
  "Jennifer L. Armentrout", "Stephanie Garber", "Holly Black",
  "Leigh Bardugo", "Sabaa Tahir", "Samantha Shannon",
  "SA Chakraborty", "Madeline Miller", "Tamsyn Muir",
  "Lily Mayne", "Laura Gallego", "Victoria Álvarez",
  "Sara Barquinero", "Andrea Abreu", "Layla Martínez",
  "María Martínez", "Andrea Longarela", "Tamara Molina",
  "Adriana Criado", "Irene Franco", "Paula Ramos", "Irina Suoma",
  // Autoras hispanohablantes populares
  "Joana Marcús", "Mercedes Ron", "Inma Rubiales", "Eloy Moreno",
  "Chloe Walsh", "Care Santos",
  "Iria G. Parente", "Selene M. Pascual",
];

function processBooks(docs: any[]): any[] {
  // Prioritize books with covers and sort by edition_count (popularity proxy)
  return docs
    .filter((d: any) => d.cover_i)
    .sort((a: any, b: any) => (b.edition_count || 0) - (a.edition_count || 0));
}

async function docsToBooks(docs: any[]): Promise<BookData[]> {
  return Promise.all(
    docs.map(async (book: any) => {
      let description = book.first_sentence?.[0] || "";
      if (!description && book.key) {
        description = await fetchDescription(book.key);
      }
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
}

/**
 * Search books by title, author, or any query.
 * Sorts by new and boosts popular YA authors when searching genres.
 */
export async function searchBooks(query: string): Promise<BookData[]> {
  // Search with sort=new to get recent books first
  const [mainRes, authorRes] = await Promise.allSettled([
    axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    // Also search for curated authors + query for better YA results
    axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&sort=editions&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  // Merge both result sets, deduplicate
  for (const result of [authorRes, mainRes]) {
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

  // Boost curated authors to the top
  const boosted = allDocs.sort((a, b) => {
    const aIsCurated = CURATED_AUTHORS.some(
      (ca) => a.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );
    const bIsCurated = CURATED_AUTHORS.some(
      (ca) => b.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
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
 * Uses Open Library's subject search for more relevant results
 * when the user describes what they want to read.
 */
export async function searchByDescription(description: string): Promise<BookData[]> {
  const [searchRes, subjectRes] = await Promise.allSettled([
    axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(description)}&sort=new&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
    axios.get(
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(description)}&sort=editions&limit=30&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count,first_publish_year`
    ),
  ]);

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

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

  // Boost curated authors first
  const boosted = allDocs.sort((a, b) => {
    const aIsCurated = CURATED_AUTHORS.some(
      (ca) => a.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );
    const bIsCurated = CURATED_AUTHORS.some(
      (ca) => b.author_name?.[0]?.toLowerCase().includes(ca.toLowerCase())
    );
    if (aIsCurated && !bIsCurated) return -1;
    if (!aIsCurated && bIsCurated) return 1;
    return (b.edition_count || 0) - (a.edition_count || 0);
  });

  const filtered = processBooks(boosted).slice(0, 25);
  const booksForAI = filtered.map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0] || "Desconocido",
    description: doc.first_sentence?.[0] || "",
    first_publish_year: doc.first_publish_year || null,
  }));

  // Use AI to rank by relevance to the description
  try {
    const { data, error } = await supabase.functions.invoke("rank-books", {
      body: { userQuery: description, books: booksForAI },
    });

    if (!error && data?.ranked) {
      const rankedDocs = data.ranked
        .filter((i: number) => i >= 0 && i < filtered.length)
        .map((i: number) => filtered[i]);
      return docsToBooks(rankedDocs.slice(0, 20));
    }
  } catch (e) {
    console.warn("AI ranking failed, using default order:", e);
  }

  // Fallback: return without AI ranking
  return docsToBooks(filtered.slice(0, 20));
}

/**
 * Fetch curated YA books from popular authors in romance & fantasy.
 */
export async function fetchTrendingBooks(): Promise<BookData[]> {
  const results = await Promise.allSettled(
    CURATED_AUTHORS.map((author) =>
      axios.get(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&sort=new&limit=4&fields=key,title,author_name,cover_i,first_sentence,subject,edition_count`
      )
    )
  );

  const allDocs: any[] = [];
  const seenTitles = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const doc of result.value.data.docs) {
        const key = doc.title?.toLowerCase();
        if (key && !seenTitles.has(key) && doc.cover_i) {
          seenTitles.add(key);
          allDocs.push(doc);
        }
      }
    }
  }

  const top30 = allDocs.slice(0, 30);
  return docsToBooks(top30);
}
