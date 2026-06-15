import type { LoaderFunctionArgs } from "@remix-run/node";
import { useMatchesData } from "~/utils";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Loader doesn't need to do anything, redirect happens in component
  return null;
};

export default function ItemsIndexPage() {
  const navigate = useNavigate();
  // Get items data from parent route
  const parentData = useMatchesData("routes/items") as
    | { items?: Array<{ id: string }> }
    | undefined;
  const items = parentData?.items ?? [];

  // Redirect to first item if available
  useEffect(() => {
    if (items.length > 0) {
      navigate(`/items/${items[0].id}`, { replace: true });
    }
  }, [items, navigate]);

  // Show empty state if no items
  if (items.length === 0) {
    return null; // Parent route handles empty state
  }

  return null;
}
