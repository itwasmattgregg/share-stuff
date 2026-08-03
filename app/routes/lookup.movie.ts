import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  formatMovieDescription,
  isMovieLookupConfigured,
  searchMoviesByTitle,
} from "~/models/lookup.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  if (!isMovieLookupConfigured()) {
    return json({
      configured: false,
      error:
        "Movie lookup needs a TMDB_API_KEY. Add one in your environment to enable title search.",
      results: [],
    });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return json({ configured: true, error: null, results: [] });
  }

  try {
    const movies = await searchMoviesByTitle(query);
    return json({
      configured: true,
      error: null,
      results: movies.map((movie) => ({
        ...movie,
        suggestedDescription: formatMovieDescription(movie),
        displayTitle: movie.year ? `${movie.title} (${movie.year})` : movie.title,
      })),
    });
  } catch {
    return json(
      {
        configured: true,
        error:
          "Movie lookup is temporarily unavailable. Try again in a moment.",
        results: [],
      },
      { status: 502 }
    );
  }
};
