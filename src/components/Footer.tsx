export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted">
          © {new Date().getFullYear()} Lab
        </p>
      </div>
    </footer>
  );
}
