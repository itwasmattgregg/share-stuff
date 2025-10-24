import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createCommunity } from "~/models/community.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const rules = formData.get("rules");

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
    ownerId: userId,
  });

  return redirect(`/communities/${community.id}`);
};

export default function NewCommunityPage() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold">Create a New Community</h2>
      <p className="mt-2 text-gray-600">
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
              placeholder="What are the rules for this community? (e.g., return items within 2 weeks, handle items with care, etc.)"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Create Community
          </button>
        </div>
      </Form>
    </div>
  );
}
