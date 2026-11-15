import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Marketplace",
  description: "Buy and sell with people near you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              <span className="logo">m</span>
              marketplace
            </Link>
            <div className="nav-actions">
  <Link href="/seller" className="btn">Connect with Stripe</Link>
  <Link href="/sell" className="btn primary">+ Create new listing</Link>
</div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}