import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "Community Guidelines - Share Stuff" },
];

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Community Guidelines
        </h1>
        <p className="text-xl text-gray-600">
          Building trust, sharing resources, and creating stronger communities
          together.
        </p>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Introduction */}
        <section className="mb-12">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-blue-900 mb-3">
              Our Vision
            </h2>
            <p className="text-blue-800">
              Share Stuff is built on the principle that we can create stronger,
              more connected communities by sharing what we have with our
              neighbors. This platform is designed to combat the isolation and
              wastefulness of capitalism by fostering trust, cooperation, and
              mutual aid.
            </p>
          </div>
        </section>

        {/* Core Principles */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Core Principles
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 mb-3">
                🤝 Mutual Aid & Trust
              </h3>
              <p className="text-green-800">
                We believe in helping each other without expectation of profit.
                Share what you can, borrow what you need, and build trust
                through consistent, respectful interactions.
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900 mb-3">
                🏘️ Community Self-Governance
              </h3>
              <p className="text-purple-800">
                Each community sets its own rules and manages its own
                membership. Community creators have the right to approve or
                remove members based on their community's values and needs.
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-orange-900 mb-3">
                🚫 No Commercial Activity
              </h3>
              <p className="text-orange-800">
                This platform is for sharing, not selling. No buying, selling,
                or commercial transactions. There are plenty of other platforms
                for that—this is about building community, not profit.
              </p>
            </div>

            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-red-900 mb-3">
                ❤️ Respect & Kindness
              </h3>
              <p className="text-red-800">
                Harassment, discrimination, or unkind behavior will not be
                tolerated. We are building a space where everyone feels safe and
                respected.
              </p>
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Community Guidelines
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Respectful Communication
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Communicate clearly and respectfully with other community
                  members
                </li>
                <li>Respond to requests and messages in a timely manner</li>
                <li>Be honest about item condition and availability</li>
                <li>Use the platform's messaging system for coordination</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Item Care & Responsibility
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Return items in the same condition you received them</li>
                <li>
                  Return items on time or communicate if you need an extension
                </li>
                <li>Report any damage or issues immediately</li>
                <li>
                  Follow any specific care instructions provided by the owner
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Community Participation
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Only join communities that align with your values and
                  interests
                </li>
                <li>Respect each community's specific rules and guidelines</li>
                <li>Contribute positively to your communities</li>
                <li>Help build trust by being reliable and consistent</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Privacy & Safety
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Respect others' privacy—don't share personal information
                </li>
                <li>Meet in safe, public places when exchanging items</li>
                <li>Trust your instincts and report concerning behavior</li>
                <li>Use the platform's privacy controls appropriately</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Prohibited Activities */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Prohibited Activities
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-red-900 mb-4">
              The following activities are strictly prohibited:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-red-800">
              <li>
                <strong>Commercial Activity:</strong> No buying, selling, or
                renting items
              </li>
              <li>
                <strong>Harassment:</strong> No bullying, intimidation, or
                unwanted contact
              </li>
              <li>
                <strong>Discrimination:</strong> No discrimination based on
                race, gender, religion, or other protected characteristics
              </li>
              <li>
                <strong>Dangerous Items:</strong> No weapons, drugs, or other
                dangerous materials
              </li>
              <li>
                <strong>Spam:</strong> No unsolicited messages or promotional
                content
              </li>
              <li>
                <strong>Fraud:</strong> No misrepresentation of items or false
                information
              </li>
            </ul>
          </div>
        </section>

        {/* Community Management */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Community Management
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                For Community Creators
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Set clear rules and expectations for your community</li>
                <li>Approve members who align with your community's values</li>
                <li>Remove members who violate community guidelines</li>
                <li>Foster a positive, inclusive environment</li>
                <li>Lead by example in respectful behavior</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                For Community Members
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Read and follow your community's specific rules</li>
                <li>Respect the community creator's decisions</li>
                <li>Report violations to community creators</li>
                <li>Contribute positively to community discussions</li>
                <li>Help maintain a welcoming environment</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Enforcement */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Enforcement & Reporting
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-900 mb-4">
              How We Handle Violations
            </h3>
            <div className="space-y-4 text-yellow-800">
              <p>
                <strong>Community-Level Enforcement:</strong> Community creators
                have the right to remove members who violate their community's
                guidelines. This is the primary method of enforcement, as
                communities know their own needs best.
              </p>
              <p>
                <strong>Platform-Level Enforcement:</strong> For serious
                violations like harassment or discrimination, the platform
                administrators may suspend or ban users from the entire
                platform.
              </p>
              <p>
                <strong>Reporting:</strong> If you experience or witness
                violations, please report them to the community creator or
                platform administrators. We take all reports seriously.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mb-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-green-900 mb-4">
              Join the Movement
            </h2>
            <p className="text-green-800 mb-6">
              Together, we can build communities based on trust, cooperation,
              and mutual aid. Every item shared, every act of kindness, every
              connection made brings us closer to a world where we take care of
              each other.
            </p>
            <div className="space-x-4">
              <Link
                to="/communities"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Browse Communities
              </Link>
              <Link
                to="/communities/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Create Community
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center text-gray-600">
          <p>
            These guidelines are living documents that may be updated as our
            community grows. Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  );
}
