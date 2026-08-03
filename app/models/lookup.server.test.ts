import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatBookDescription,
  formatMovieDescription,
  lookupBookByIsbn,
  searchBooksByTitle,
  searchMoviesByTitle,
} from "~/models/lookup.server";
import { isValidIsbn, normalizeIsbn } from "~/utils/item-form";

describe("item-form helpers", () => {
  it("normalizes and validates ISBNs", () => {
    expect(normalizeIsbn("978-0-14-032872-1")).toBe("9780140328721");
    expect(isValidIsbn("9780140328721")).toBe(true);
    expect(isValidIsbn("0140328726")).toBe(true);
    expect(isValidIsbn("123")).toBe(false);
  });
});

describe("lookup.server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it("looks up a book by ISBN via Open Library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          "ISBN:9780140328721": {
            title: "Matilda",
            authors: [{ name: "Roald Dahl" }],
            publish_date: "1988",
            number_of_pages: 240,
            identifiers: { isbn_13: ["9780140328721"] },
            cover: { medium: "https://covers.example/matilda.jpg" },
          },
        }),
      })
    );

    const book = await lookupBookByIsbn("978-0-14-032872-1");

    expect(book).toEqual({
      title: "Matilda",
      authors: ["Roald Dahl"],
      description: "Published 1988 · 240 pages",
      publishYear: "1988",
      isbn: "9780140328721",
      coverUrl: "https://covers.example/matilda.jpg",
    });
    expect(formatBookDescription(book!)).toContain("By Roald Dahl");
  });

  it("returns null when ISBN is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );

    await expect(lookupBookByIsbn("9780140328721")).resolves.toBeNull();
  });

  it("searches books by title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            {
              title: "The Hobbit",
              author_name: ["J. R. R. Tolkien"],
              first_publish_year: 1937,
              isbn: ["9780547928227"],
              cover_i: 123,
              first_sentence: "In a hole in the ground there lived a hobbit.",
            },
          ],
        }),
      })
    );

    const results = await searchBooksByTitle("Hobbit");

    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("The Hobbit");
    expect(results[0]?.coverUrl).toContain("/123-M.jpg");
  });

  it("returns no movies when TMDB is not configured", async () => {
    await expect(searchMoviesByTitle("Inception")).resolves.toEqual([]);
  });

  it("searches movies via TMDB when configured", async () => {
    process.env.TMDB_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 27205,
              title: "Inception",
              release_date: "2010-07-16",
              overview: "A thief who steals corporate secrets...",
              poster_path: "/inception.jpg",
            },
          ],
        }),
      })
    );

    const results = await searchMoviesByTitle("Inception");

    expect(results).toEqual([
      {
        id: 27205,
        title: "Inception",
        year: "2010",
        overview: "A thief who steals corporate secrets...",
        posterUrl: "https://image.tmdb.org/t/p/w185/inception.jpg",
      },
    ]);
    expect(formatMovieDescription(results[0]!)).toContain("(2010)");
  });
});
