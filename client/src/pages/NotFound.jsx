import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-muted/40 px-4">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-extrabold text-primary">404</h1>
        <p className="mb-4 text-xl font-medium text-foreground">Oops! Page not found</p>
        <p className="mb-6 text-sm text-muted-foreground">The page you are looking for might have been moved or removed.</p>
        <Link
          to="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-accent transition-colors shadow-sm"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
