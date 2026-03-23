import { Sparkles } from "lucide-react";
import { BookData } from "./BookCard";

interface BookRecommendationProps {
  book: BookData;
  searchQuery: string | null;
}

function generateRecommendation(book: BookData, searchQuery: string | null): string {
  const title = book.title;
  const author = book.author;

  if (!searchQuery) {
    return `"${title}" de ${author} es una lectura imprescindible. Con una narrativa envolvente y personajes memorables, este libro te atrapará desde la primera página.`;
  }

  const q = searchQuery.toLowerCase();
  const reasons: string[] = [];

  if (q.includes("romance") || q.includes("love") || q.includes("amor")) {
    reasons.push("una historia de amor que te hará suspirar");
  }
  if (q.includes("fantasy") || q.includes("fantasía") || q.includes("magic") || q.includes("magia")) {
    reasons.push("un mundo de fantasía rico y envolvente");
  }
  if (q.includes("adventure") || q.includes("aventura")) {
    reasons.push("aventuras épicas que te mantendrán al borde del asiento");
  }
  if (q.includes("mystery") || q.includes("misterio") || q.includes("thriller")) {
    reasons.push("giros inesperados que no podrás predecir");
  }
  if (q.includes("science fiction") || q.includes("ciencia ficción") || q.includes("space") || q.includes("espacio")) {
    reasons.push("una exploración fascinante de mundos futuristas");
  }
  if (q.includes("dragon") || q.includes("dragón") || q.includes("dragones")) {
    reasons.push("dragones y criaturas míticas que cobran vida");
  }

  if (reasons.length === 0) {
    reasons.push("una trama que conecta directamente con lo que buscas");
  }

  return `Basándonos en tu búsqueda "${searchQuery}", te recomendamos "${title}" de ${author} porque ofrece ${reasons.join(" y ")}. Este libro ha cautivado a miles de lectores con su narrativa única y personajes profundos que te acompañarán mucho después de la última página.`;
}

const BookRecommendation = ({ book, searchQuery }: BookRecommendationProps) => {
  const recommendation = generateRecommendation(book, searchQuery);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display text-2xl text-primary">¿POR QUÉ TE LO RECOMENDAMOS?</h3>
      </div>
      <p className="text-sm leading-relaxed text-secondary-foreground">{recommendation}</p>
    </div>
  );
};

export default BookRecommendation;
