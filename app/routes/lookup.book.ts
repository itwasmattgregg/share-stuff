import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import {
  formatBookDescription,
  lookupBookByIsbn,
  searchBooksByTitle,
} from "~/models/lookup.server";
import { requireUserId } from "~/session.server";
import { isValidIsbn, normalizeIsbn } from "~/utils/item-form";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);

  const url = new URL(request.url);
  const isbnParam = url.searchParams.get("isbn");
  const query = url.searchParams.get("q")?.trim() ?? "";

  try {
    if (isbnParam) {
      const isbn = normalizeIsbn(isbnParam);
      if (!isValidIsbn(isbn)) {
        return json(
          { error: "Enter a valid 10- or 13-digit ISBN.", results: [] },
          { status: 400 }
        );
      }

      const book = await lookupBookByIsbn(isbn);
      if (!book) {
        return json({ error: "No book found for that ISBN.", results: [] });
      }

      return json({
        error: null,
        results: [
          {
            ...book,
            suggestedDescription: formatBookDescription(book),
          },
        ],
      });
    }

    if (query.length < 2) {
      return json({ error: null, results: [] });
    }

    const books = await searchBooksByTitle(query);
    return json({
      error: null,
      results: books.map((book) => ({
        ...book,
        suggestedDescription: formatBookDescription(book),
      })),
    });
  } catch {
    return json(
      {
        error: "Book lookup is temporarily unavailable. Try again in a moment.",
        results: [],
      },
      { status: 502 }
    );
  }
};
