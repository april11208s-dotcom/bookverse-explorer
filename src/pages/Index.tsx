import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, BookOpen, Heart, X } from "lucide-react";
import BookCard, { BookData } from "@/components/BookCard";

const Index = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BookData[]>([]);
  const [favorites, setFavorites] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const saved: BookData[] = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
  }, [books]);

  const searchBooks = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowFavorites(false);
    try {
      const res = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
      );
      const results: BookData[] = res.data.docs.slice(0, 20).map((book: any) => ({
        title: book.title,
        author: book.author_name?.[0] || "Desconocido",
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        description: book.first_sentence?.[0] || "Sinopsis no disponible.",
      }));
      setBooks(results);
    } catch {
      setBooks([]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") searchBooks();
  };

  const displayBooks = showFavorites ? favorites : books;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl text-primary">BOOKFLIX</h1>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar libros..."
                className="h-10 w-64 rounded-full border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all md:w-80"
              />
            </div>
            <button
              onClick={searchBooks}
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
        {/* Hero - shown before search */}
        {!searched && !showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32"
            style={{ background: "var(--gradient-hero)" }}
          >
            <BookOpen className="mb-6 h-20 w-20 text-primary" />
            <h2 className="mb-4 text-center font-display text-6xl text-foreground md:text-8xl">
              DESCUBRE TU PRÓXIMO LIBRO
            </h2>
            <p className="max-w-lg text-center text-lg text-muted-foreground">
              Busca entre millones de libros, guarda tus favoritos y califica tus lecturas.
            </p>
          </motion.div>
        )}

        {/* Section title */}
        {(searched || showFavorites) && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-3xl text-foreground">
              {showFavorites ? "MIS FAVORITOS" : `RESULTADOS PARA "${query.toUpperCase()}"`}
            </h2>
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
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Results grid */}
        {!loading && displayBooks.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {displayBooks.map((book, i) => (
              <BookCard key={`${book.title}-${i}`} book={book} index={i} />
            ))}
          </div>
        )}

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
