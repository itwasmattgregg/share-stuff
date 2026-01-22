import { Link, useLocation } from "@remix-run/react";
import { useOptionalUser, useMatchesData } from "~/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const user = useOptionalUser();
  const location = useLocation();
  const rootData = useMatchesData("root") as { messageCount?: number } | undefined;
  const messageCount = rootData?.messageCount || 0;

  if (!user) return null;

  const navItems = [
    { to: "/communities", label: "My Communities", icon: "🏘️" },
    { to: "/items", label: "My Items", icon: "📦" },
    { to: "/lending", label: "Lending", icon: "🔄" },
    { to: "/messages", label: "Messages", icon: "💬", badgeCount: messageCount },
    { to: "/guidelines", label: "Guidelines", icon: "📋" },
    { to: "/report", label: "Report", icon: "🚨" },
  ];

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    navItems.push({ to: "/admin", label: "Admin", icon: "👑" });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-neutral-200 flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <nav className="p-4 space-y-1 h-full overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-primary-50 text-primary-700 border-l-4 border-primary-500"
                    : "text-neutral-700 hover:bg-neutral-50 hover:text-primary-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-500 rounded-full">
                    {item.badgeCount > 9 ? "9+" : item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
