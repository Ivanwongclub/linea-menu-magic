/**
 * Placeholder /admin index content for Phase 1 — proves RequireCatalogueEditor
 * + AdminLayout work end to end before any product/finish/taxonomy UI exists.
 * Replaced once the product list (Phase 3) lands.
 */
export default function AdminHome() {
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-xl font-light tracking-wide text-foreground">Signed in</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        You're signed in as a catalogue editor. Products, finishes, and taxonomy
        management land here in the next build phases.
      </p>
    </div>
  );
}
