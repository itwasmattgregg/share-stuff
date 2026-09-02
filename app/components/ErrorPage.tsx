import { Link } from "@remix-run/react";

import ShareStuffLogo from "~/components/ShareStuffLogo";

interface ErrorPageProps {
  title: string;
  message: string;
  detail?: string;
}

export default function ErrorPage({ title, message, detail }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex text-primary-600 hover:text-primary-700"
          aria-label="ShareStuff home"
        >
          <ShareStuffLogo />
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="mt-4 text-neutral-600">{message}</p>
          {detail ? (
            <p className="mt-3 text-sm text-neutral-500">{detail}</p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/communities"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-600"
            >
              Go to my communities
            </Link>
            <Link
              to="/"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-primary-500 px-4 py-3 text-center font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
