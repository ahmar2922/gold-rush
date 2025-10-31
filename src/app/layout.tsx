export const metadata = { title: "Gold Rush" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#f8fafc", color: "#0f172a" }}>{children}</body>
    </html>
  );
}
