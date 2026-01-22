import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MO Legislative Dashboard",
  description: "Live Missouri legislative dashboard powered by LegiScan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
