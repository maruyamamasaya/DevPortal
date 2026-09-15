export type LayoutBlock = { itemId: string; column: number; row: number; width: number; height: number };
export type GridLayout = { columns: number; rows: number; blocks: LayoutBlock[] };

export function canPlace(layout: GridLayout, block: LayoutBlock, excludeItemId?: string): boolean {
  if (!Number.isInteger(block.column) || !Number.isInteger(block.row) || !Number.isInteger(block.width) || !Number.isInteger(block.height) || block.column < 1 || block.row < 1 || block.width < 1 || block.height < 1 || block.column + block.width - 1 > layout.columns || block.row + block.height - 1 > layout.rows) return false;
  return layout.blocks.every((other) => {
    if (other.itemId === excludeItemId) return true;
    return block.column + block.width <= other.column || other.column + other.width <= block.column || block.row + block.height <= other.row || other.row + other.height <= block.row;
  });
}

export function placeBlock(layout: GridLayout, block: LayoutBlock): GridLayout | null {
  if (layout.blocks.some((item) => item.itemId === block.itemId) || !canPlace(layout, block)) return null;
  return { ...layout, blocks: [...layout.blocks, block] };
}

export function updateBlock(layout: GridLayout, block: LayoutBlock): GridLayout | null {
  if (!layout.blocks.some((item) => item.itemId === block.itemId) || !canPlace(layout, block, block.itemId)) return null;
  return { ...layout, blocks: layout.blocks.map((item) => item.itemId === block.itemId ? block : item) };
}

export function readLayout(value: unknown, itemIds: Set<string>): GridLayout | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Partial<GridLayout>;
  if (!Number.isInteger(candidate.columns) || !Number.isInteger(candidate.rows) || (candidate.columns ?? 0) < 4 || (candidate.columns ?? 0) > 6 || (candidate.rows ?? 0) < 4 || (candidate.rows ?? 0) > 12 || !Array.isArray(candidate.blocks)) return null;
  let layout: GridLayout = { columns: candidate.columns!, rows: candidate.rows!, blocks: [] };
  for (const item of candidate.blocks) {
    if (!item || typeof item !== "object") continue;
    const stored = item as LayoutBlock & { appId?: string; size?: string };
    const itemId = typeof stored.itemId === "string" ? stored.itemId : typeof stored.appId === "string" ? `app:${stored.appId}` : null;
    if (!itemId || !itemIds.has(itemId)) continue;
    const legacyDimensions = stored.size === "1x1" ? { width: 1, height: 1 } : stored.size === "3x1" ? { width: 3, height: 1 } : stored.size === "2x2" ? { width: 2, height: 2 } : null;
    const next = placeBlock(layout, { itemId, column: stored.column, row: stored.row, width: stored.width ?? legacyDimensions?.width ?? 0, height: stored.height ?? legacyDimensions?.height ?? 0 });
    if (next) layout = next;
  }
  return layout;
}

export function starterLayout(appIds: string[]): GridLayout {
  const placements: Omit<LayoutBlock, "itemId">[] = [
    { column: 1, row: 1, width: 3, height: 1 },
    { column: 4, row: 1, width: 1, height: 1 },
    { column: 1, row: 2, width: 2, height: 2 },
    { column: 3, row: 2, width: 2, height: 2 },
  ];
  return { columns: 4, rows: 4, blocks: appIds.slice(0, 4).map((appId, index) => ({ itemId: `app:${appId}`, ...placements[index] })) };
}
