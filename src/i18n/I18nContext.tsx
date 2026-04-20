import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "es" | "en";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  es: {
    "search.title": "Buscar por título...",
    "search.description": "Describe lo que quieres leer... ej: aventuras en el espacio",
    "search.author": "Buscar por autor... ej: Chloe Walsh",
    "mode.title": "Título",
    "mode.author": "Autor",
    "mode.description": "Descripción",
    "btn.search": "Buscar",
    "btn.favorites": "Favoritos",
    "hero.title": "DESCUBRE TU PRÓXIMO LIBRO",
    "hero.subtitle": "Busca por título o describe lo que quieres leer. Encuentra entre millones de libros.",
    "suggest.magic": "🧙 Magia y fantasía",
    "suggest.scifi": "🚀 Ciencia ficción",
    "suggest.romance": "💕 Romance",
    "suggest.mystery": "🔎 Misterio",
    "trending.heading": "📚 ROMANCE & FANTASÍA JUVENIL",
    "trending.empty": "No se pudieron cargar las novedades.",
    "results.favorites": "MIS FAVORITOS",
    "results.byDescription": "LIBROS QUE COINCIDEN CON TU DESCRIPCIÓN",
    "results.byAuthor": 'LIBROS DE "{q}"',
    "results.byTitle": 'RESULTADOS PARA "{q}"',
    "loading.description": "Buscando libros que coincidan con tu descripción...",
    "loading.author": "Buscando libros de este autor...",
    "loading.title": "Buscando libros y cargando sinopsis...",
    "empty.search": "No se encontraron resultados. Intenta otra búsqueda.",
    "empty.favorites": "Aún no tienes favoritos. ¡Busca y guarda libros que te gusten!",
    "detail.back": "Volver",
    "detail.yourRating": "Tu puntuación:",
    "detail.savedFav": "Guardado en favoritos",
    "detail.saveFav": "Guardar en favoritos",
    "detail.synopsis": "SINOPSIS",
    "detail.noSynopsis": "Sinopsis no disponible para este título.",
    "rec.heading": "¿POR QUÉ TE LO RECOMENDAMOS?",
    "rec.loading": "Generando recomendación personalizada...",
    "reviews.heading": "RESEÑAS",
    "reviews.write": "Escribe tu reseña",
    "reviews.name": "Tu nombre",
    "reviews.yourRating": "Tu puntuación:",
    "reviews.placeholder": "¿Qué te pareció este libro?",
    "reviews.publish": "Publicar reseña",
    "reviews.empty": "Sé el primero en dejar una reseña sobre este libro.",
    "lang.toggle": "EN",
    "lang.label": "Idioma",
  },
  en: {
    "search.title": "Search by title...",
    "search.description": "Describe what you want to read... e.g. space adventures",
    "search.author": "Search by author... e.g. Chloe Walsh",
    "mode.title": "Title",
    "mode.author": "Author",
    "mode.description": "Description",
    "btn.search": "Search",
    "btn.favorites": "Favorites",
    "hero.title": "DISCOVER YOUR NEXT BOOK",
    "hero.subtitle": "Search by title or describe what you want to read. Find among millions of books.",
    "suggest.magic": "🧙 Magic & fantasy",
    "suggest.scifi": "🚀 Science fiction",
    "suggest.romance": "💕 Romance",
    "suggest.mystery": "🔎 Mystery",
    "trending.heading": "📚 YA ROMANCE & FANTASY",
    "trending.empty": "Could not load new releases.",
    "results.favorites": "MY FAVORITES",
    "results.byDescription": "BOOKS MATCHING YOUR DESCRIPTION",
    "results.byAuthor": 'BOOKS BY "{q}"',
    "results.byTitle": 'RESULTS FOR "{q}"',
    "loading.description": "Looking for books that match your description...",
    "loading.author": "Searching books by this author...",
    "loading.title": "Searching books and loading synopses...",
    "empty.search": "No results found. Try another search.",
    "empty.favorites": "You don't have favorites yet. Search and save books you like!",
    "detail.back": "Back",
    "detail.yourRating": "Your rating:",
    "detail.savedFav": "Saved in favorites",
    "detail.saveFav": "Save to favorites",
    "detail.synopsis": "SYNOPSIS",
    "detail.noSynopsis": "Synopsis not available for this title.",
    "rec.heading": "WHY WE RECOMMEND IT?",
    "rec.loading": "Generating personalized recommendation...",
    "reviews.heading": "REVIEWS",
    "reviews.write": "Write your review",
    "reviews.name": "Your name",
    "reviews.yourRating": "Your rating:",
    "reviews.placeholder": "What did you think of this book?",
    "reviews.publish": "Publish review",
    "reviews.empty": "Be the first to leave a review for this book.",
    "lang.toggle": "ES",
    "lang.label": "Language",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "bookflix-lang";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "es";
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    return saved === "en" || saved === "es" ? saved : "es";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string, vars?: Record<string, string>) => {
    let str = translations[lang][key] ?? translations.es[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
