import type { LoaderFunctionArgs } from "@remix-run/node";
import { useMatchesData } from "~/utils";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Loader doesn't need to do anything, redirect happens in component
  return null;
};

export default function CommunitiesIndexPage() {
  const navigate = useNavigate();
  // Get communities data from parent route
  const parentData = useMatchesData("routes/communities");
  const communities = parentData?.communities || [];

  // Redirect to first community if available
  useEffect(() => {
    if (communities.length > 0) {
      navigate(`/communities/${communities[0].id}`, { replace: true });
    }
  }, [communities, navigate]);

  // Don't show welcome box if user has at least one community
  if (communities.length > 0) {
    return null;
  }

  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-4 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
          Welcome to ShareStuff! 👋
        </h2>
        <p className="mt-4 text-neutral-600 text-base sm:text-lg">
          Select a community from the sidebar to get started, or create a new
          community to share your things with others.
        </p>
        <div className="mt-6 sm:mt-8 text-left">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-4">How it works:</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <span className="text-neutral-700 font-medium">Create or join a community</span>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-secondary-50 rounded-lg border border-secondary-100">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <span className="text-neutral-700 font-medium">Add items you're willing to share</span>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-accent-50 rounded-lg border border-accent-100">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <span className="text-neutral-700 font-medium">Browse and request items from others</span>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <span className="text-neutral-700 font-medium">Approve lending requests and track returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
