import { Link } from "@remix-run/react";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage the Share Stuff platform and community.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            📋 Reports Management
          </h2>
          <p className="text-gray-600 mb-4">
            Review and manage community guideline violations.
          </p>
          <Link
            to="/admin/reports"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Manage Reports
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            👥 User Management
          </h2>
          <p className="text-gray-600 mb-4">
            View and manage platform users and their roles.
          </p>
          <Link
            to="/admin/users"
            className="inline-block bg-success-600 text-white px-4 py-2 rounded hover:bg-success-700"
          >
            Manage Users
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🏘️ Community Management
          </h2>
          <p className="text-gray-600 mb-4">
            Monitor and manage communities across the platform.
          </p>
          <Link
            to="/admin/communities"
            className="inline-block bg-secondary-500 text-white px-4 py-2 rounded hover:bg-secondary-700"
          >
            Manage Communities
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            📊 Analytics
          </h2>
          <p className="text-gray-600 mb-4">
            View lending activity, community health, and platform metrics.
          </p>
          <Link
            to="/admin/stats"
            className="inline-block bg-warning-500 text-white px-4 py-2 rounded hover:bg-warning-700"
          >
            View Analytics
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            ⚙️ System Settings
          </h2>
          <p className="text-gray-600 mb-4">
            Configure platform settings and preferences.
          </p>
          <Link
            to="/admin/settings"
            className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            System Settings
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/communities"
          className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Communities
        </Link>
      </div>
    </div>
  );
}
