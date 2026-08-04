import { isValidIsbn, normalizeIsbn } from "~/utils/item-form";

export type BookLookupResult = {
  title: string;
  authors: string[];
  description: string | null;
  publishYear: string | null;
  isbn: string | null;
  coverUrl: string | null;
};

export type MovieLookupResult = {
  id: number;
  title: string;
  year: string | null;
  overview: string | null;
  posterUrl: string | null;
};

type OpenLibraryBookData = {
  title?: string;
  authors?: Array<{ name?: string }>;
  publish_date?: string;
  number_of_pages?: number;
  subjects?: Array<{ name?: string }>;
  cover?: { medium?: string; large?: string; small?: string };
  identifiers?: { isbn_13?: string[]; isbn_10?: string[] };
  excerpts?: Array<{ text?: string }>;
  notes?: string;
};

type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  first_sentence?: string[] | string;
};

type TmdbSearchResponse = {
  results?: Array<{
    id: number;
    title?: string;
    release_date?: string;
    overview?: string;
    poster_path?: string | null;
  }>;
};

export function isMovieLookupConfigured() {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

function buildBookDescription(data: OpenLibraryBookData) {
  const excerpt = data.excerpts?.find((entry) => entry.text)?.text?.trim();
  if (excerpt) {
    return excerpt;
  }

  if (typeof data.notes === "string" && data.notes.trim()) {
    return data.notes.trim();
  }

  const parts: string[] = [];
  if (data.publish_date) {
    parts.push(`Published ${data.publish_date}`);
  }
  if (data.number_of_pages) {
    parts.push(`${data.number_of_pages} pages`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export async function lookupBookByIsbn(
  rawIsbn: string
): Promise<BookLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isValidIsbn(isbn)) {
    return null;
  }

  const url = new URL("https://openlibrary.org/api/books");
  url.searchParams.set("bibkeys", `ISBN:${isbn}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("jscmd", "data");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Open Library lookup failed (${response.status})`);
  }

  const payload = (await response.json()) as Record<
    string,
    OpenLibraryBookData | undefined
  >;
  const data = payload[`ISBN:${isbn}`];
  if (!data?.title) {
    return null;
  }

  const authors =
    data.authors
      ?.map((author) => author.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  return {
    title: data.title.trim(),
    authors,
    description: buildBookDescription(data),
    publishYear: data.publish_date?.match(/\d{4}/)?.[0] ?? null,
    isbn:
      data.identifiers?.isbn_13?.[0] ??
      data.identifiers?.isbn_10?.[0] ??
      isbn,
    coverUrl: data.cover?.medium ?? data.cover?.large ?? data.cover?.small ?? null,
  };
}

export async function searchBooksByTitle(
  query: string,
  limit = 5
): Promise<BookLookupResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", trimmed);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", "title,author_name,first_publish_year,isbn,cover_i,first_sentence");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Open Library search failed (${response.status})`);
  }

  const payload = (await response.json()) as { docs?: OpenLibrarySearchDoc[] };

  return (payload.docs ?? [])
    .filter((doc) => doc.title)
    .map((doc) => {
      const isbn = doc.isbn?.[0] ?? null;
      const firstSentence = Array.isArray(doc.first_sentence)
        ? doc.first_sentence[0]
        : doc.first_sentence;

      return {
        title: doc.title!.trim(),
        authors: doc.author_name ?? [],
        description: firstSentence?.trim() || null,
        publishYear: doc.first_publish_year
          ? String(doc.first_publish_year)
          : null,
        isbn,
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
      };
    });
}

export async function searchMoviesByTitle(
  query: string,
  limit = 5
): Promise<MovieLookupResult[]> {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", trimmed);
  url.searchParams.set("include_adult", "false");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`TMDB search failed (${response.status})`);
  }

  const payload = (await response.json()) as TmdbSearchResponse;

  return (payload.results ?? [])
    .filter((movie) => movie.title)
    .slice(0, limit)
    .map((movie) => ({
      id: movie.id,
      title: movie.title!.trim(),
      year: movie.release_date?.slice(0, 4) || null,
      overview: movie.overview?.trim() || null,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
        : null,
    }));
}

export function formatBookDescription(result: BookLookupResult) {
  const parts: string[] = [];

  if (result.authors.length > 0) {
    parts.push(`By ${result.authors.join(", ")}`);
  }
  if (result.publishYear) {
    parts.push(result.publishYear);
  }
  if (result.isbn) {
    parts.push(`ISBN ${result.isbn}`);
  }

  const meta = parts.join(" · ");
  if (result.description && meta) {
    return `${meta}\n\n${result.description}`;
  }

  return result.description || meta || "";
}

export function formatMovieDescription(result: MovieLookupResult) {
  const year = result.year ? ` (${result.year})` : "";
  if (result.overview) {
    return `${result.title}${year}\n\n${result.overview}`;
  }
  return result.title ? `${result.title}${year}` : "";
}
