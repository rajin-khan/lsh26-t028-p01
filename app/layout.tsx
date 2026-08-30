import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KajChole | Load-shedding work planner",
  description:
    "Plan grid, generator, and no-power jobs around today's load-shedding windows.",
  applicationName: "KajChole",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#11140f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
