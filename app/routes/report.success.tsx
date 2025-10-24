import { Link } from "@remix-run/react";

export default function ReportSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      <div className="mb-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Report Submitted Successfully
        </h1>
        <p className="text-xl text-gray-600">
          Thank you for helping us maintain a safe and respectful community.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-3">
          What happens next?
        </h2>
        <ul className="text-green-800 space-y-2 text-left">
          <li>
            • Your report has been received and will be reviewed by our team
          </li>
          <li>• We may contact you for additional information if needed</li>
          <li>
            • Appropriate action will be taken based on our community guidelines
          </li>
          <li>
            • You will be notified of the outcome (while respecting everyone's
            privacy)
          </li>
          <li>• Reports are typically reviewed within 24-48 hours</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          Need immediate help?
        </h2>
        <p className="text-blue-800 mb-4">
          If you're experiencing harassment or feel unsafe, you can:
        </p>
        <ul className="text-blue-800 space-y-2 text-left">
          <li>• Block the user who is causing issues</li>
          <li>• Leave the community if the issue is community-specific</li>
          <li>• Contact the community creator directly</li>
          <li>• Reach out to platform administrators for urgent matters</li>
        </ul>
      </div>

      <div className="space-y-4">
        <Link
          to="/communities"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Return to Communities
        </Link>
        <div>
          <Link
            to="/guidelines"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Review Community Guidelines
          </Link>
        </div>
      </div>
    </div>
  );
}

