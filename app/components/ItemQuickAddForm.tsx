import { Form, useNavigation } from "@remix-run/react";
import { useEffect, useId, useRef, useState } from "react";

import ItemPhotoField from "~/components/ItemPhotoField";
import TagInput from "~/components/TagInput";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  isBookCategory,
  isMovieCategory,
  isValidIsbn,
  normalizeIsbn,
} from "~/utils/item-form";

type LookupResult = {
  title: string;
  suggestedDescription: string;
  authors?: string[];
  publishYear?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  year?: string | null;
  overview?: string | null;
  posterUrl?: string | null;
  displayTitle?: string;
};

type ItemQuickAddFormProps = {
  photoUploadEnabled: boolean;
  movieLookupEnabled: boolean;
  recentlyAddedName?: string | null;
  initialCategory?: string | null;
  errors?: {
    name?: string;
    photo?: string;
    tags?: string;
  };
};

export default function ItemQuickAddForm({
  photoUploadEnabled,
  movieLookupEnabled,
  recentlyAddedName,
  initialCategory = "",
  errors,
}: ItemQuickAddFormProps) {
  const navigation = useNavigation();
  const nameRef = useRef<HTMLInputElement>(null);
  const isbnRef = useRef<HTMLInputElement>(null);
  const formKeyRef = useRef(0);
  const detailsId = useId();

  const startingCategory =
    initialCategory &&
    ITEM_CATEGORIES.includes(
      initialCategory as (typeof ITEM_CATEGORIES)[number]
    )
      ? initialCategory
      : "";

  const [category, setCategory] = useState(startingCategory);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isbn, setIsbn] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResults, setLookupResults] = useState<LookupResult[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isSubmitting = navigation.state === "submitting";
  const showBookTools = isBookCategory(category);
  const showMovieTools = isMovieCategory(category);

  useEffect(() => {
    if (errors?.name) {
      nameRef.current?.focus();
    }
  }, [errors]);

  useEffect(() => {
    if (startingCategory) {
      setCategory(startingCategory);
    }
  }, [startingCategory]);

  useEffect(() => {
    if (recentlyAddedName) {
      formKeyRef.current += 1;
      setFormKey(formKeyRef.current);
      setName("");
      setDescription("");
      setIsbn("");
      setLookupResults([]);
      setLookupError(null);
      setShowDetails(false);
      // Keep category so rapid book/movie adds stay in context.
      window.setTimeout(() => nameRef.current?.focus(), 0);
    }
  }, [recentlyAddedName]);

  useEffect(() => {
    setLookupResults([]);
    setLookupError(null);
  }, [category]);

  useEffect(() => {
    if (!showMovieTools || !movieLookupEnabled) {
      return;
    }

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setLookupResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLookingUp(true);
      setLookupError(null);
      try {
        const response = await fetch(
          `/lookup/movie?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        const data = (await response.json()) as {
          error?: string | null;
          results?: LookupResult[];
        };
        if (!response.ok && data.error) {
          setLookupError(data.error);
          setLookupResults([]);
          return;
        }
        setLookupResults(data.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLookupError("Movie lookup failed. Try again.");
        }
      } finally {
        setIsLookingUp(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [name, showMovieTools, movieLookupEnabled]);

  useEffect(() => {
    if (!showBookTools) {
      return;
    }

    const trimmed = name.trim();
    // Prefer ISBN lookup when that field is in use.
    if (isbn.trim().length > 0 || trimmed.length < 3) {
      if (isbn.trim().length === 0 && trimmed.length < 3) {
        setLookupResults([]);
      }
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLookingUp(true);
      setLookupError(null);
      try {
        const response = await fetch(
          `/lookup/book?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        const data = (await response.json()) as {
          error?: string | null;
          results?: LookupResult[];
        };
        if (!response.ok && data.error) {
          setLookupError(data.error);
          setLookupResults([]);
          return;
        }
        setLookupResults(data.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLookupError("Book search failed. Try again.");
        }
      } finally {
        setIsLookingUp(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [name, isbn, showBookTools]);

  async function lookupIsbn() {
    const normalized = normalizeIsbn(isbn);
    if (!isValidIsbn(normalized)) {
      setLookupError("Enter a valid 10- or 13-digit ISBN.");
      isbnRef.current?.focus();
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const response = await fetch(
        `/lookup/book?isbn=${encodeURIComponent(normalized)}`
      );
      const data = (await response.json()) as {
        error?: string | null;
        results?: LookupResult[];
      };

      if (data.error) {
        setLookupError(data.error);
        setLookupResults([]);
        return;
      }

      const book = data.results?.[0];
      if (!book) {
        setLookupError("No book found for that ISBN.");
        setLookupResults([]);
        return;
      }

      applyLookup(book);
      setLookupResults([]);
    } catch {
      setLookupError("Book lookup failed. Try again.");
    } finally {
      setIsLookingUp(false);
    }
  }

  function applyLookup(result: LookupResult) {
    setName(result.displayTitle || result.title);
    if (result.suggestedDescription) {
      setDescription(result.suggestedDescription);
      setShowDetails(true);
    }
    if (result.isbn) {
      setIsbn(result.isbn);
    }
    setLookupResults([]);
    setLookupError(null);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold">Quick add</h2>
      <p className="mt-2 text-sm sm:text-base text-gray-600">
        Name is enough. Add details only when you want them.
      </p>

      {recentlyAddedName ? (
        <div
          className="mt-4 rounded-md border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800"
          role="status"
        >
          Added <span className="font-medium">{recentlyAddedName}</span>. Keep
          going — add another below.
        </div>
      ) : null}

      <Form
        key={formKey}
        method="post"
        encType="multipart/form-data"
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ITEM_CATEGORIES.map((option) => {
              const selected = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setCategory((current) => (current === option ? "" : option))
                  }
                  className={`rounded-md border px-3 py-2 text-sm min-h-[40px] transition-colors ${
                    selected
                      ? "border-primary-500 bg-primary-50 text-primary-800"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="category" value={category} />
          {showBookTools ? (
            <p className="mt-2 text-sm text-gray-500">
              Tip: paste an ISBN to auto-fill title and details.
            </p>
          ) : null}
          {showMovieTools ? (
            <p className="mt-2 text-sm text-gray-500">
              {movieLookupEnabled
                ? "Start typing a title to search movies and fill details."
                : "Set TMDB_API_KEY to enable movie title lookup."}
            </p>
          ) : null}
        </div>

        {showBookTools ? (
          <div>
            <label
              htmlFor="isbn"
              className="block text-sm font-medium text-gray-700"
            >
              ISBN
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                ref={isbnRef}
                id="isbn"
                name="isbn"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={isbn}
                onChange={(event) => setIsbn(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void lookupIsbn();
                  }
                }}
                placeholder="9780140328721"
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => void lookupIsbn()}
                disabled={isLookingUp}
                className="w-full sm:w-auto rounded-md border border-primary-300 bg-primary-50 px-4 py-3 text-base font-medium text-primary-800 hover:bg-primary-100 min-h-[44px] disabled:opacity-60"
              >
                {isLookingUp ? "Looking up…" : "Look up"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="relative">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Item Name *
          </label>
          <div className="mt-1">
            <input
              ref={nameRef}
              id="name"
              required
              autoFocus={true}
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                showBookTools
                  ? "Book title"
                  : showMovieTools
                  ? "Movie title"
                  : "What are you sharing?"
              }
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              aria-invalid={errors?.name ? true : undefined}
              aria-describedby={errors?.name ? "name-error" : undefined}
              autoComplete="off"
            />
            {errors?.name ? (
              <div className="pt-1 text-danger-700" id="name-error">
                {errors.name}
              </div>
            ) : null}
          </div>

          {lookupResults.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
              {lookupResults.map((result, index) => (
                <li key={`${result.title}-${result.isbn ?? result.year ?? index}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-neutral-50"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applyLookup(result);
                    }}
                  >
                    {(result.coverUrl || result.posterUrl) && (
                      <img
                        src={result.coverUrl || result.posterUrl || ""}
                        alt=""
                        className="h-12 w-9 flex-shrink-0 rounded object-cover bg-neutral-100"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-900">
                        {result.displayTitle || result.title}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {result.authors?.length
                          ? result.authors.join(", ")
                          : result.year
                          ? result.year
                          : result.isbn
                          ? `ISBN ${result.isbn}`
                          : "Use this match"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {lookupError ? (
          <p className="text-sm text-danger-700" role="alert">
            {lookupError}
          </p>
        ) : null}

        {isLookingUp && lookupResults.length === 0 ? (
          <p className="text-sm text-gray-500">Searching…</p>
        ) : null}

        <div>
          <button
            type="button"
            className="text-sm font-medium text-primary-700 hover:text-primary-900"
            aria-expanded={showDetails}
            aria-controls={detailsId}
            onClick={() => setShowDetails((value) => !value)}
          >
            {showDetails ? "Hide details" : "Add details (optional)"}
          </button>

          {showDetails ? (
            <div id={detailsId} className="mt-4 space-y-6">
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
                    placeholder="Describe the item, any special instructions, etc."
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="condition"
                  className="block text-sm font-medium text-gray-700"
                >
                  Condition
                </label>
                <div className="mt-1">
                  <select
                    id="condition"
                    name="condition"
                    className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
                    defaultValue=""
                  >
                    <option value="">Select condition</option>
                    {ITEM_CONDITIONS.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <TagInput error={errors?.tags} />

              {photoUploadEnabled ? (
                <ItemPhotoField error={errors?.photo} />
              ) : (
                <p className="text-sm text-gray-500">
                  Photo uploads are not configured in this environment yet.
                </p>
              )}
            </div>
          ) : (
            <input type="hidden" name="description" value={description} />
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            name="intent"
            value="add"
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-md border border-success-600 bg-white px-6 py-3 text-base font-medium text-success-700 hover:bg-success-50 min-h-[44px] disabled:opacity-60"
          >
            Add item
          </button>
          <button
            type="submit"
            name="intent"
            value="add-another"
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-md bg-success-500 px-6 py-3 text-base font-medium text-white hover:bg-success-700 min-h-[44px] disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add & another"}
          </button>
        </div>
      </Form>
    </div>
  );
}
