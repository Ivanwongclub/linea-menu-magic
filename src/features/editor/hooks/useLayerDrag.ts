import { createContext, useContext } from "react";
import type { PaintGroupMember } from "../lib/paintGroups";

export interface LayerDropDestination { groupId: string | null; overLayerId?: string }
export const LayerDragContext = createContext<{ member: PaintGroupMember | null; destination: LayerDropDestination | null }>({ member: null, destination: null });
export const useLayerDrag = () => useContext(LayerDragContext);
