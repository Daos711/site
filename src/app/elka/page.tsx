import type { Metadata } from "next";
import { ElkaGate } from "./ElkaGate";

// Not linked from the navigation, the section list or any sitemap. Kept out of
// robots.txt on purpose: that file is public and naming the path there would
// hand the address to exactly the crawlers it is meant to stay away from.
export const metadata: Metadata = {
  title: "Ёлка",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ElkaPage() {
  return <ElkaGate />;
}
