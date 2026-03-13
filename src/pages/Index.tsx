import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Heart, X, MessageSquareText, BookMarked } from "lucide-react";
import BookCard, { BookData } from "@/components/BookCard";
import { searchBooks, searchByDescription } from "@/lib/bookApi";

type SearchMode = "title" | "description";

const Index = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BookData[]>([]);
  const [favorites, setFavorites] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("title");

  useEffect(() => {
    const saved: BookData[] = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
  }, [books]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowFavorites(false);
    try {
      const results =
        searchMode === "description"
          ? await searchByDescription(query)
          : await searchBooks(query);
      setBooks(results);
    } catch {
      setBooks([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const displayBooks = showFavorites ? favorites : books;

  const placeholders: Record<SearchMode, string> = {
    title: "Buscar por título o autor...",
    description: "Describe lo que quieres leer... ej: aventuras en el espacio",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-primary">BOOKFLIX</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search mode toggle */}
            <div className="flex h-10 overflow-hidden rounded-full border border-border bg-secondary">
              <button
                onClick={() => setSearchMode("title")}
                className={`flex items-center gap-1 px-3 text-xs font-medium transition-all ${
                  searchMode === "title"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookMarked className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Título</span>
              </button>
              <button
                onClick={() => setSearchMode("description")}
                className={`flex items-center gap-1 px-3 text-xs font-medium transition-all ${
                  searchMode === "description"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Descripción</span>
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholders[searchMode]}
                className="h-10 w-52 rounded-full border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all sm:w-64 md:w-80"
              />
            </div>

            <button
              onClick={handleSearch}
              className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Buscar
            </button>

            <button
              onClick={() => {
                setShowFavorites(!showFavorites);
                const saved: BookData[] = JSON.parse(localStorage.getItem("favorites") || "[]");
                setFavorites(saved);
              }}
              className={`flex h-10 items-center gap-1 rounded-full px-4 text-sm font-medium transition-all ${
                showFavorites
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">Favoritos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        {!searched && !showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
            style={{ background: "var(--gradient-hero)" }}
          >
            <BookOpen className="mb-6 h-20 w-20 text-primary" />
            <h2 className="mb-4 text-center font-display text-6xl text-foreground md:text-8xl">
              DESCUBRE TU PRÓXIMO LIBRO
            </h2>
            <p className="mb-8 max-w-lg text-center text-lg text-muted-foreground">
              Busca por título o describe lo que quieres leer. Encuentra entre millones de libros.
            </p>

            {/* Example searches */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: "🧙 Magia y fantasía", mode: "description" as SearchMode, q: "magic fantasy wizards" },
                { label: "🚀 Ciencia ficción", mode: "description" as SearchMode, q: "science fiction space adventure" },
                { label: "💕 Romance", mode: "description" as SearchMode, q: "love romance drama" },
                { label: "🔎 Misterio", mode: "description" as SearchMode, q: "mystery detective thriller" },
              ].map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => {
                    setQuery(suggestion.q);
                    setSearchMode(suggestion.mode);
                    setTimeout(() => {
                      setLoading(true);
                      setSearched(true);
                      searchByDescription(suggestion.q)
                        .then(setBooks)
                        .catch(() => setBooks([]))
                        .finally(() => setLoading(false));
                    }, 0);
                  }}
                  className="rounded-full border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:border-primary hover:text-primary"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Section title */}
        {(searched || showFavorites) && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl text-foreground">
                {showFavorites
                  ? "MIS FAVORITOS"
                  : searchMode === "description"
                  ? "LIBROS QUE COINCIDEN CON TU DESCRIPCIÓN"
                  : `RESULTADOS PARA "${query.toUpperCase()}"`}
              </h2>
              {searched && !showFavorites && searchMode === "description" && (
                <p className="mt-1 text-sm text-muted-foreground">"{query}"</p>
              )}
            </div>
            {showFavorites && (
              <button
                onClick={() => setShowFavorites(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {searchMode === "description"
                ? "Buscando libros que coincidan con tu descripción..."
                : "Buscando libros y cargando sinopsis..."}
            </p>
          </div>
        )}

        {/* Results grid */}
        <AnimatePresence>
          {!loading && displayBooks.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayBooks.map((book, i) => (
                <BookCard key={`${book.title}-${i}`} book={book} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Empty states */}
        {!loading && searched && !showFavorites && books.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            No se encontraron resultados. Intenta otra búsqueda.
          </p>
        )}
        {!loading && showFavorites && favorites.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">
            Aún no tienes favoritos. ¡Busca y guarda libros que te gusten!
          </p>
        )}
      </main>
    </div>
  );
};

export default Index;
