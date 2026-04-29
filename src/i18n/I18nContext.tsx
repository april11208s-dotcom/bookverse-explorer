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
    // Auth
    "auth.title": "BIENVENIDO A BOOKFLIX",
    "auth.subtitle": "Crea tu cuenta o inicia sesión para descubrir tu próxima lectura.",
    "auth.signIn": "Iniciar sesión",
    "auth.signUp": "Crear cuenta",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.displayName": "Nombre",
    "auth.haveAccount": "¿Ya tienes cuenta? Inicia sesión",
    "auth.noAccount": "¿No tienes cuenta? Regístrate",
    "auth.signOut": "Cerrar sesión",
    "auth.signInBtn": "Entrar",
    "auth.signUpBtn": "Crear cuenta",
    "auth.loading": "Cargando...",
    "auth.errorGeneric": "Ocurrió un error. Inténtalo de nuevo.",
    "auth.account": "Mi cuenta",
    "auth.editPrefs": "Editar mis gustos",
    // Onboarding
    "onb.title": "CUÉNTANOS QUÉ TE GUSTA LEER",
    "onb.subtitle": "Personalizaremos tus recomendaciones con esta info.",
    "onb.step": "Paso {n} de {total}",
    "onb.next": "Siguiente",
    "onb.back": "Atrás",
    "onb.finish": "Terminar",
    "onb.skip": "Saltar por ahora",
    "onb.q.genres": "¿Qué géneros te gustan más?",
    "onb.q.tones": "¿Qué tono prefieres?",
    "onb.q.tropes": "¿Qué tropos románticos te encantan?",
    "onb.q.pace": "¿Qué ritmo prefieres?",
    "onb.q.length": "¿Qué longitud prefieres?",
    "onb.q.authors": "¿Tienes autoras favoritas? (opcional)",
    "onb.authors.placeholder": "Ej: Chloe Walsh, Sarah J. Maas",
    "onb.pace.slow": "Lento e introspectivo",
    "onb.pace.medium": "Equilibrado",
    "onb.pace.fast": "Rápido y trepidante",
    "onb.length.short": "Cortos (<300 págs)",
    "onb.length.medium": "Medios (300-500 págs)",
    "onb.length.long": "Largos (>500 págs)",
    "trending.foryou": "✨ RECOMENDADO PARA TI",
    "chat.title": "CHAT CON LA IA",
    "chat.placeholder": "Escribe lo que buscas...",
    "btn.chat": "Chat IA",
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
    // Auth
    "auth.title": "WELCOME TO BOOKFLIX",
    "auth.subtitle": "Create an account or sign in to discover your next read.",
    "auth.signIn": "Sign in",
    "auth.signUp": "Sign up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.displayName": "Name",
    "auth.haveAccount": "Already have an account? Sign in",
    "auth.noAccount": "No account yet? Sign up",
    "auth.signOut": "Sign out",
    "auth.signInBtn": "Sign in",
    "auth.signUpBtn": "Create account",
    "auth.loading": "Loading...",
    "auth.errorGeneric": "Something went wrong. Try again.",
    "auth.account": "My account",
    "auth.editPrefs": "Edit my taste",
    // Onboarding
    "onb.title": "TELL US WHAT YOU LIKE TO READ",
    "onb.subtitle": "We'll personalize your recommendations with this info.",
    "onb.step": "Step {n} of {total}",
    "onb.next": "Next",
    "onb.back": "Back",
    "onb.finish": "Finish",
    "onb.skip": "Skip for now",
    "onb.q.genres": "Which genres do you love most?",
    "onb.q.tones": "What tone do you prefer?",
    "onb.q.tropes": "Which romantic tropes do you adore?",
    "onb.q.pace": "What pace do you prefer?",
    "onb.q.length": "What length do you prefer?",
    "onb.q.authors": "Got favorite authors? (optional)",
    "onb.authors.placeholder": "E.g. Chloe Walsh, Sarah J. Maas",
    "onb.pace.slow": "Slow and introspective",
    "onb.pace.medium": "Balanced",
    "onb.pace.fast": "Fast and gripping",
    "onb.length.short": "Short (<300 pages)",
    "onb.length.medium": "Medium (300-500 pages)",
    "onb.length.long": "Long (>500 pages)",
    "trending.foryou": "✨ RECOMMENDED FOR YOU",
    "chat.title": "CHAT WITH AI",
    "chat.placeholder": "Type what you're looking for...",
    "btn.chat": "AI Chat",
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
