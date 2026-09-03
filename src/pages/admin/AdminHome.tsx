import { Link } from "react-router-dom";

/**
 * Placeholder /admin index content — proves RequireCatalogueEditor +
 * AdminLayout work end to end. Replaced once the product list (Phase 3) lands.
 */
export default function AdminHome() {
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-xl font-light tracking-wide text-foreground">Signed in</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        You're signed in as a catalogue editor.{" "}
        <Link to="/admin/taxonomy" className="underline hover:no-underline">
          Taxonomy management
        </Link>{" "}
        is ready. Products and finishes land in the next build phases.
      </p>
    </div>
  );
}
