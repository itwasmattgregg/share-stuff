import path from "node:path";

import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";

process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "vitest-session-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  `file:${path.join(process.cwd(), "prisma", "test.db")}`;

installGlobals();
