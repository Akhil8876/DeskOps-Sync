import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-[var(--color-accent)]">404</h1>
      <p className="text-[var(--color-text-muted)]">Page not found</p>
      <Link href="/" className="text-sm text-[var(--color-accent)] hover:underline">
        Back to Aria
      </Link>
    </div>
  );
}
