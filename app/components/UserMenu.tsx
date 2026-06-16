import { Form, Link } from "@remix-run/react";
import { useState } from "react";

import type { User } from "~/models/user.server";

type UserMenuProps = {
  user: User;
  buttonClassName?: string;
};

export default function UserMenu({
  user,
  buttonClassName = "flex min-h-[44px] items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600",
}: UserMenuProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className={buttonClassName}
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
      >
        <span>{user.name || user.email}</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {userMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setUserMenuOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              onClick={() => setUserMenuOpen(false)}
            >
              My Profile
            </Link>
            {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                onClick={() => setUserMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            ) : null}
            <div className="my-1 border-t border-neutral-200" />
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="block w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
              >
                Logout
              </button>
            </Form>
          </div>
        </>
      )}
    </div>
  );
}
