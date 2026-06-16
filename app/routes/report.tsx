import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createReport } from "~/models/report.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const reason = formData.get("reason");
  const description = formData.get("description");
  const evidence = formData.get("evidence");

  const errors: { reason?: string; description?: string } = {};

  if (!reason || typeof reason !== "string") {
    errors.reason = "Please select a reason";
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    errors.description = "Please provide a description";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  await createReport({
    reason: reason as string,
    description: description as string,
    evidence: typeof evidence === "string" ? evidence : undefined,
    reporterId: userId,
  });

  return redirect("/report/success");
};

export default function ReportPage() {
  const actionData = useActionData<typeof action>();
  const reasonRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (actionData?.errors?.reason) {
      reasonRef.current?.focus();
    } else if (actionData?.errors?.description) {
      descriptionRef.current?.focus();
    }
  }, [actionData]);

  const reportReasons = [
    "Harassment or bullying",
    "Discrimination or hate speech",
    "Commercial activity (buying/selling)",
    "Spam or unsolicited messages",
    "Dangerous or illegal items",
    "Fraud or misrepresentation",
    "Inappropriate content",
    "Violation of community rules",
    "Other",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Report a Violation
        </h1>
        <p className="text-xl text-gray-600">
          Help us maintain a safe and respectful community by reporting
          violations of our community guidelines.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-yellow-900 mb-2">
          Before You Report
        </h2>
        <ul className="text-yellow-800 space-y-1">
          <li>
            • Make sure the behavior violates our{" "}
            <Link to="/guidelines" className="underline">
              Community Guidelines
            </Link>
          </li>
          <li>
            • For community-specific issues, consider contacting the community
            creator first
          </li>
          <li>• Provide specific details about what happened and when</li>
          <li>• Reports are reviewed by platform administrators</li>
        </ul>
      </div>

      <Form method="post" className="space-y-6">
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What type of violation are you reporting? *
          </label>
          <select
            ref={reasonRef}
            id="reason"
            name="reason"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
            aria-invalid={actionData?.errors?.reason ? true : undefined}
          >
            <option value="">Select a violation type</option>
            {reportReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
          {actionData?.errors?.reason && (
            <div className="pt-1 text-red-700">{actionData.errors.reason}</div>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Please describe what happened *
          </label>
          <textarea
            ref={descriptionRef}
            id="description"
            name="description"
            rows={6}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
            placeholder="Provide specific details about the incident, including what was said or done, when it happened, and any relevant context..."
            aria-invalid={actionData?.errors?.description ? true : undefined}
          />
          {actionData?.errors?.description && (
            <div className="pt-1 text-red-700">
              {actionData.errors.description}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="evidence"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Additional Evidence (Optional)
          </label>
          <textarea
            id="evidence"
            name="evidence"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg"
            placeholder="Screenshots, links to specific messages, or other evidence that supports your report..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Include any screenshots, message links, or other evidence that
            supports your report.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your report will be reviewed by platform administrators</li>
            <li>• We may contact you for additional information</li>
            <li>• Appropriate action will be taken based on our guidelines</li>
            <li>
              • You will be notified of the outcome (while respecting privacy)
            </li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/communities"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Submit Report
          </button>
        </div>
      </Form>
    </div>
  );
}
