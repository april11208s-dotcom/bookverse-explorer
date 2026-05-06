import { useEffect, useState } from "react";
import axios from "axios";
import { ExternalLink, ShoppingCart, BookOpen } from "lucide-react";
import { BookData } from "@/components/BookCard";

interface Props {
  book: BookData;
}

interface VolumeInfo {
  id: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
  embeddable?: boolean;
  viewability?: string;
}

const BookPreview = ({ book }: Props) => {
  const [vol, setVol] = useState<VolumeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVol(null);
    const q = `intitle:${book.title}${book.author ? `+inauthor:${book.author}` : ""}`;
    axios
      .get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`, {
        timeout: 6000,
      })
      .then((res) => {
        if (cancelled) return;
        const item = res.data?.items?.[0];
        if (item) {
          setVol({
            id: item.id,
            previewLink: item.volumeInfo?.previewLink,
            infoLink: item.volumeInfo?.infoLink,
            canonicalVolumeLink: item.volumeInfo?.canonicalVolumeLink,
            embeddable: item.accessInfo?.embeddable,
            viewability: item.accessInfo?.viewability,
          });
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [book.title, book.author]);

  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(`${book.title} ${book.author}`)}&i=stripbooks`;
  const casaDelLibroUrl = `https://www.casadellibro.com/busqueda-generica.php?busqueda=${encodeURIComponent(`${book.title} ${book.author}`)}`;
  const libbyUrl = `https://libbyapp.com/search/shelf/query/${encodeURIComponent(book.title)}`;

  const hasPreview = vol?.embeddable && vol?.viewability && vol.viewability !== "NO_PAGES";

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-display text-2xl text-foreground">Vista previa & dónde leer</h2>

      {loading && (
        <p className="text-sm text-muted-foreground">Buscando vista previa…</p>
      )}

      {!loading && hasPreview && vol && (
        <div className="overflow-hidden rounded-lg border border-border bg-secondary/40">
          <iframe
            title={`Vista previa de ${book.title}`}
            src={`https://books.google.com/books?id=${vol.id}&printsec=frontcover&output=embed`}
            className="h-[500px] w-full"
            loading="lazy"
          />
        </div>
      )}

      {!loading && !hasPreview && (
        <p className="text-sm text-muted-foreground">
          No hay vista previa gratuita disponible para este libro.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {vol?.infoLink && (
          <a
            href={vol.infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:border-primary hover:text-primary"
          >
            <BookOpen className="h-4 w-4" />
            Google Books
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <a
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:border-primary hover:text-primary"
        >
          <ShoppingCart className="h-4 w-4" />
          Amazon
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={casaDelLibroUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:border-primary hover:text-primary"
        >
          <ShoppingCart className="h-4 w-4" />
          Casa del Libro
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={libbyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-all hover:border-primary hover:text-primary"
        >
          <BookOpen className="h-4 w-4" />
          Libby (biblioteca)
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        Las vistas previas y compras se gestionan a través de servicios externos legales.
      </p>
    </div>
  );
};

export default BookPreview;