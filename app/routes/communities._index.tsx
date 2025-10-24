export default function CommunitiesIndexPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome to Share Stuff!
      </h2>
      <p className="mt-4 text-gray-600">
        Select a community from the sidebar to get started, or create a new
        community to share your things with others.
      </p>
      <div className="mt-8">
        <h3 className="text-lg font-semibold">How it works:</h3>
        <ul className="mt-4 space-y-2 text-left">
          <li className="flex items-start">
            <span className="mr-2 text-blue-500">1.</span>
            <span>Create or join a community</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-500">2.</span>
            <span>Add items you're willing to share</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-500">3.</span>
            <span>Browse and request items from others</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-500">4.</span>
            <span>Approve lending requests and track returns</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
