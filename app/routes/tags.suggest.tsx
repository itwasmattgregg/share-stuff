import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getTagSuggestions } from "~/models/tag.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  const suggestions = await getTagSuggestions({ query, userId });

  return json({
    suggestions: suggestions.map((tag) => ({
      name: tag.name,
      slug: tag.slug,
    })),
  });
};
