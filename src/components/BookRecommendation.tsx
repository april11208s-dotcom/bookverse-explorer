import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { BookData } from "./BookCard";
import { supabase } from "@/integrations/supabase/client";

interface BookRecommendationProps {
  book: BookData;
  searchQuery: string | null;
}

const BookRecommendation = ({ book, searchQuery }: BookRecommendationProps) => {
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendation = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("recommend-book", {
          body: {
            title: book.title,
            author: book.author,
            description: book.description,
            searchQuery,
          },
        });

        if (!cancelled && !error && data?.recommendation) {
          setRecommendation(data.recommendation);
        } else if (!cancelled) {
          setRecommendation(
            `"${book.title}" de ${book.author} es una lectura imprescindible. Con una narrativa envolvente y personajes memorables, este libro te atrapará desde la primera página.`
          );
        }
      } catch {
        if (!cancelled) {
          setRecommendation(
            `"${book.title}" de ${book.author} es una lectura imprescindible con una narrativa única que no te puedes perder.`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommendation();
    return () => { cancelled = true; };
  }, [book.title, book.author, book.description, searchQuery]);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display text-2xl text-primary">¿POR QUÉ TE LO RECOMENDAMOS?</h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando recomendación personalizada...
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-secondary-foreground">{recommendation}</p>
      )}
    </div>
  );
};

export default BookRecommendation;
