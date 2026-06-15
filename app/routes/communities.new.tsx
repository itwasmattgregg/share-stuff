import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { createCommunity } from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const rules = formData.get("rules");
  const isListed = formData.get("isListed") === "true";

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { name: "Community name is required" } },
      { status: 400 }
    );
  }

  const community = await createCommunity({
    name,
    description: typeof description === "string" ? description : undefined,
    rules: typeof rules === "string" ? rules : undefined,
    isListed,
    ownerId: userId,
  });

  return redirect(`/communities/${community.id}`);
};

export default function NewCommunityPage() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const [isListed, setIsListed] = useState(true);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold">Create a New Community</h2>
      <p className="mt-2 text-sm sm:text-base text-gray-600">
        Start a community where people can share their things with each other.
      </p>

      <Form method="post" className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Community Name *
          </label>
          <div className="mt-1">
            <input
              ref={nameRef}
              id="name"
              required
              autoFocus={true}
              name="name"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-describedby={
                actionData?.errors?.name ? "name-error" : undefined
              }
            />
            {actionData?.errors?.name ? (
              <div className="pt-1 text-red-700" id="name-error">
                {actionData.errors.name}
              </div>
            ) : null}
          </div>
        </div>

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
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              placeholder="What is this community about?"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="rules"
            className="block text-sm font-medium text-gray-700"
          >
            Community Rules
          </label>
          <div className="mt-1">
            <textarea
              id="rules"
              name="rules"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-3 text-base min-h-[44px]"
              placeholder="What are the rules for this community? (e.g., return items within 2 weeks, handle items with care, etc.)"
            />
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                List in Discover
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">
                Allow anyone to find this community and request to join. Members
                and items are always private until approved.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isListed}
              onClick={() => setIsListed(!isListed)}
              className={`relative mt-0.5 flex-shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isListed ? "bg-primary-500" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isListed ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <input type="hidden" name="isListed" value={String(isListed)} />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto rounded-md bg-blue-500 px-6 py-3 text-base font-medium text-white hover:bg-blue-600 min-h-[44px]"
          >
            Create Community
          </button>
        </div>
      </Form>
    </div>
  );
}
