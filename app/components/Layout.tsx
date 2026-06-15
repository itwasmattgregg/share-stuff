import { Link, Form, useLocation } from "@remix-run/react";
import { useState } from "react";
import UserMenu from "~/components/UserMenu";
import { useOptionalUser, useMatchesData } from "~/utils";

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export default function Layout({
  children,
  showNavigation = true,
}: LayoutProps) {
  const user = useOptionalUser();
  const location = useLocation();
  const rootData = useMatchesData("root") as
    | { notificationCount?: number }
    | undefined;
  const notificationCount = rootData?.notificationCount || 0;
  const messageCount =
    (rootData as { messageCount?: number } | undefined)?.messageCount || 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navigation on public pages
  const publicPages = ["/", "/login", "/join", "/forgot-password"];
  const isPublicPage =
    publicPages.includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");

  if (!showNavigation || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Navigation Header */}
      <nav className="relative bg-white mb-10">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Always on the left */}
            <div className="flex flex-shrink-0 items-center">
              <Link
                to="/communities"
                className="flex items-center space-x-3 text-primary-600 hover:text-primary-700"
              >
                <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                  ShareStuff
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-4 md:flex">
              <Link
                to="/communities"
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
              >
                Communities
              </Link>
              <Link
                to="/items"
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
              >
                My Items
              </Link>
              <Link
                to="/lending"
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
              >
                Lending
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 inline-flex -translate-y-1/2 translate-x-1/2 transform items-center justify-center rounded-full bg-primary-500 px-2 py-1 text-xs font-bold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user && <UserMenu user={user} messageCount={messageCount} />}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                to="/notifications"
                className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute right-0 top-0 inline-flex -translate-y-1/2 translate-x-1/2 transform items-center justify-center rounded-full bg-primary-500 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-neutral-200 bg-white md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              <Link
                to="/communities"
                className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Communities
              </Link>
              <Link
                to="/items"
                className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Items
              </Link>
              <Link
                to="/lending"
                className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lending
              </Link>
              <Link
                to="/notifications"
                className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>
              {user && (
                <>
                  <div className="my-1 border-t border-neutral-200" />
                  <Link
                    to="/profile"
                    className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/messages"
                    className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                    {messageCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold leading-none text-white">
                        {messageCount > 9 ? "9+" : messageCount}
                      </span>
                    )}
                  </Link>
                  {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
                    <Link
                      to="/admin"
                      className="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  ) : null}
                  <div className="border-t border-neutral-200 pt-2">
                    <Form action="/logout" method="post">
                      <button
                        type="submit"
                        className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </Form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Sine wave border below nav with shadow */}
        <div className="pointer-events-none absolute -bottom-8 left-0 right-0 h-10 overflow-visible">
          <svg
            className="h-full w-full"
            viewBox="0 -80 1200 180"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="waveShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* White background above wave - extends up to cover gap */}
            <path
              d="M 0,-80 L 0,50 
                 C 150,20 300,20 450,50
                 S 750,80 900,50
                 S 1200,20 1200,50
                 L 1200,-80 Z"
              fill="rgb(255, 255, 255)"
            />
            {/* Smooth sine wave outline with shadow */}
            <path
              d="M 0,50 
                 C 150,20 300,20 450,50
                 S 750,80 900,50
                 S 1200,20 1200,50"
              fill="none"
              stroke="rgb(229, 231, 235)"
              strokeWidth="2.5"
              filter="url(#waveShadow)"
            />
          </svg>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="p-4 sm:p-6">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-sm text-neutral-600">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                to="/guidelines"
                className="transition-colors hover:text-primary-600"
              >
                Community Guidelines
              </Link>
              <span className="hidden text-neutral-300 sm:inline">•</span>
              <Link
                to="/report"
                className="transition-colors hover:text-primary-600"
              >
                Report an Issue
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-neutral-500 sm:flex-row sm:gap-4">
              <span>Copyright {new Date().getFullYear()}</span>
              <span className="hidden text-neutral-300 sm:inline">•</span>
              <span>
                Made by{" "}
                <a
                  href="https://codegregg.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary-600"
                >
                  CodeGregg
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
