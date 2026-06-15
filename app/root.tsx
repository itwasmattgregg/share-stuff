import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { getUser } from "~/session.server";
import { getUnreadNotificationCount } from "~/models/notification.server";
import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const requestUrl = new URL(request.url);
  const user = await getUser(request);
  const notificationCount = user
    ? await getUnreadNotificationCount({ userId: user.id })
    : 0;
  
  return json({
    user,
    requestUrl: requestUrl.toString(),
    socialImageUrl: new URL("/og-image.png", requestUrl).toString(),
    notificationCount,
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const requestUrl = data?.requestUrl ?? "https://example.com";
  const socialImageUrl = data?.socialImageUrl ?? `${requestUrl}/og-image.png`;

  return [
    { property: "og:type", content: "website" },
    { property: "og:url", content: requestUrl },
    {
      property: "og:title",
      content: "ShareStuff - Build Stronger Communities Through Sharing",
    },
    {
      property: "og:description",
      content:
        "Join a community where neighbors share tools, books, and resources. Build connections, reduce waste, and strengthen your local community.",
    },
    { property: "og:image", content: socialImageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },

    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "ShareStuff - Build Stronger Communities Through Sharing",
    },
    {
      name: "twitter:description",
      content:
        "Join a community where neighbors share tools, books, and resources. Build connections, reduce waste, and strengthen your local community.",
    },
    { name: "twitter:image", content: socialImageUrl },
  ];
};

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
