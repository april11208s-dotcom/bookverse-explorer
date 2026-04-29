import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface BookRef {
  title: string;
  author: string;
}

interface FetchedBook extends BookRef {
  cover: string | null;
  workKey: string | null;
}

// Parses lines like:
//   - **Title** by Author — pitch
//   * **Title** de Autora - pitch
//   **Title** by Author
function parseBookRefs(markdown: string): BookRef[] {
  const refs: BookRef[] = [];
  const seen = new Set<string>();
  const regex = /\*\*([^*]+?)\*\*\s*(?:by|de|por)\s+([^—\-–\n*()]+?)(?=\s*[—\-–(]|\s*$|\n)/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const title = match[1].trim().replace(/[.,:;]+$/, "");
    const author = match[2].trim().replace(/[.,:;]+$/, "");
    const key = `${title}|${author}`.toLowerCase();
    if (title && author && !seen.has(key)) {
      seen.add(key);
      refs.push({ title, author });
    }
  }
  return refs;
}

async function fetchCover(ref: BookRef): Promise<FetchedBook> {
  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(ref.title)}&author=${encodeURIComponent(ref.author)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    const doc = data?.docs?.[0];
    const coverId = doc?.cover_i;
    const workKey: string | undefined = doc?.key;
    return {
      ...ref,
      cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      workKey: workKey ? workKey.replace("/works/", "") : null,
    };
  } catch {
    return { ...ref, cover: null, workKey: null };
  }
}

const ChatBookCovers = ({ markdown }: { markdown: string }) => {
  const [books, setBooks] = useState<FetchedBook[]>([]);

  useEffect(() => {
    const refs = parseBookRefs(markdown);
    if (refs.length === 0) {
      setBooks([]);
      return;
    }
    let cancelled = false;
    Promise.all(refs.slice(0, 5).map(fetchCover)).then((res) => {
      if (!cancelled) setBooks(res);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  if (books.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {books.map((b, i) => {
        const inner = (
          <div className="group flex flex-col gap-1.5">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted shadow-md transition-transform group-hover:scale-105">
              {b.cover ? (
                <img
                  src={b.cover}
                  alt={b.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                  {b.title}
                </div>
              )}
            </div>
            <p className="line-clamp-2 text-xs font-semibold text-foreground">{b.title}</p>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{b.author}</p>
          </div>
        );
        return b.workKey ? (
          <Link key={i} to={`/book/${b.workKey}`}>
            {inner}
          </Link>
        ) : (
          <div key={i}>{inner}</div>
        );
      })}
    </div>
  );
};

export default ChatBookCovers;