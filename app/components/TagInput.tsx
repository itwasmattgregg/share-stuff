import { useEffect, useRef, useState } from "react";

import {
  MAX_TAGS_PER_ITEM,
  MAX_TAG_LENGTH,
  dedupeTagNames,
  normalizeTagSlug,
} from "~/utils/tag";

type TagInputProps = {
  name?: string;
  defaultTags?: string[];
  error?: string;
};

type Suggestion = {
  name: string;
  slug: string;
};

export default function TagInput({
  name = "tags",
  defaultTags = [],
  error,
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(() => dedupeTagNames(defaultTags));
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/tags/suggest?q=${encodeURIComponent(inputValue)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        // Ignore aborted or failed suggestion requests.
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(rawValue: string) {
    const trimmed = rawValue.trim().replace(/,$/, "");
    if (!trimmed) {
      return;
    }

    if (trimmed.length > MAX_TAG_LENGTH) {
      setLocalError(`Each tag must be ${MAX_TAG_LENGTH} characters or fewer.`);
      return;
    }

    const slug = normalizeTagSlug(trimmed);
    if (!slug) {
      setLocalError("Tags must contain letters or numbers.");
      return;
    }

    if (tags.some((tag) => normalizeTagSlug(tag) === slug)) {
      setInputValue("");
      setLocalError(null);
      return;
    }

    if (tags.length >= MAX_TAGS_PER_ITEM) {
      setLocalError(`You can add at most ${MAX_TAGS_PER_ITEM} tags.`);
      return;
    }

    setTags((current) => [...current, trimmed]);
    setInputValue("");
    setLocalError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function removeTag(index: number) {
    setTags((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setLocalError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === "Backspace" && inputValue.length === 0 && tags.length > 0) {
      event.preventDefault();
      removeTag(tags.length - 1);
    }
  }

  const displayError = error || localError;

  return (
    <div ref={containerRef}>
      <label
        htmlFor="tag-input"
        className="block text-sm font-medium text-gray-700"
      >
        Tags
      </label>
      <p className="mt-1 text-sm text-gray-500">
        Add tags to help people find this item. Press Enter or comma to add.
      </p>
      <div className="relative mt-2">
        <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
          {tags.map((tag, index) => (
            <span
              key={`${normalizeTagSlug(tag)}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-sm text-primary-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-primary-600 hover:text-primary-800"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id="tag-input"
            type="text"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setShowSuggestions(true);
              setLocalError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? "e.g. camping, outdoor, family-friendly" : "Add another tag"}
            className="min-w-[8rem] flex-1 border-0 p-0 text-base focus:outline-none focus:ring-0"
            disabled={tags.length >= MAX_TAGS_PER_ITEM}
          />
        </div>

        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            {suggestions.map((suggestion) => (
              <li key={suggestion.slug}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    addTag(suggestion.name);
                  }}
                >
                  {suggestion.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {tags.length}/{MAX_TAGS_PER_ITEM} tags
        </span>
      </div>

      {tags.map((tag) => (
        <input key={normalizeTagSlug(tag)} type="hidden" name={name} value={tag} />
      ))}

      {displayError ? (
        <div className="pt-1 text-danger-700">{displayError}</div>
      ) : null}
    </div>
  );
}
