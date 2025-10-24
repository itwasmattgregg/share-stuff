import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import { getUserCommunities } from "~/models/community.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const communities = await getUserCommunities({ userId });
  return json({ communities });
};

export default function CommunitiesPage() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">My Communities</Link>
        </h1>
        <div className="flex items-center gap-4">
          <span>{user.name || user.email}</span>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-80 border-r bg-gray-50">
          <div className="p-4">
            <Link
              to="new"
              className="block w-full rounded-md bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600"
            >
              + Create Community
            </Link>
            <Link
              to="browse"
              className="mt-2 block w-full rounded-md bg-green-500 px-4 py-2 text-center text-white hover:bg-green-600"
            >
              Browse Communities
            </Link>
            <Link
              to="/items"
              className="mt-2 block w-full rounded-md bg-orange-500 px-4 py-2 text-center text-white hover:bg-orange-600"
            >
              My Items
            </Link>
            <Link
              to="/lending"
              className="mt-2 block w-full rounded-md bg-purple-500 px-4 py-2 text-center text-white hover:bg-purple-600"
            >
              Lending Dashboard
            </Link>
            <Link
              to="/guidelines"
              className="mt-2 block w-full rounded-md bg-gray-500 px-4 py-2 text-center text-white hover:bg-gray-600"
            >
              Community Guidelines
            </Link>
            <Link
              to="/report"
              className="mt-2 block w-full rounded-md bg-red-500 px-4 py-2 text-center text-white hover:bg-red-600"
            >
              Report a Violation
            </Link>
            <Link
              to="/admin"
              className="mt-2 block w-full rounded-md bg-indigo-500 px-4 py-2 text-center text-white hover:bg-indigo-600"
            >
              Admin Dashboard
            </Link>
          </div>

          <hr />

          {data.communities.length === 0 ? (
            <p className="p-4">No communities yet</p>
          ) : (
            <div className="p-4">
              <h3 className="mb-2 font-semibold">Your Communities:</h3>
              <ul className="space-y-2">
                {data.communities.map((community) => (
                  <li key={community.id}>
                    <Link
                      to={community.id}
                      className="block rounded-md border border-gray-200 p-3 hover:bg-gray-100"
                    >
                      <div className="font-medium">{community.name}</div>
                      <div className="text-sm text-gray-600">
                        {community.description || "No description"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {community._count.memberships} members
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
