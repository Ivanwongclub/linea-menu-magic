import { useParams, useSearchParams } from "react-router-dom";
import { EditorNewPage } from "./pages/EditorNewPage";
import { EditorDesignPage } from "./pages/EditorDesignPage";

/**
 * Single entry point for both `/designer-studio/editor/new` and
 * `/designer-studio/editor/:designId` — one `React.lazy` chunk, split by
 * route param at render time rather than by two separate lazy imports (R3).
 */
export default function EditorRoute() {
  const { designId } = useParams();
  const [search] = useSearchParams();

  if (designId) {
    return <EditorDesignPage designId={designId} />;
  }
  return <EditorNewPage productSlug={search.get("product")} />;
}
