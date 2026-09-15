export type BlockSize = "1x1" | "3x1" | "2x2";
export type LayoutBlock = { appId: string; column: number; row: number; size: BlockSize };
export type GridLayout = { columns: number; rows: number; blocks: LayoutBlock[] };

export const BLOCK_SIZES: Record<BlockSize, { width: number; height: number }> = {
  "1x1": { width: 1, height: 1 },
  "3x1": { width: 3, height: 1 },
  "2x2": { width: 2, height: 2 },
};

export function canPlace(layout: GridLayout, block: LayoutBlock, excludeAppId?: string): boolean {
  const size = BLOCK_SIZES[block.size];
  if (!Number.isInteger(block.column) || !Number.isInteger(block.row) || block.column < 1 || block.row < 1 || block.column + size.width - 1 > layout.columns || block.row + size.height - 1 > layout.rows) return false;
  return layout.blocks.every((other) => {
    if (other.appId === excludeAppId) return true;
    const otherSize = BLOCK_SIZES[other.size];
    return block.column + size.width <= other.column || other.column + otherSize.width <= block.column || block.row + size.height <= other.row || other.row + otherSize.height <= block.row;
  });
}

export function placeBlock(layout: GridLayout, block: LayoutBlock): GridLayout | null {
  if (layout.blocks.some((item) => item.appId === block.appId) || !canPlace(layout, block)) return null;
  return { ...layout, blocks: [...layout.blocks, block] };
}

export function updateBlock(layout: GridLayout, block: LayoutBlock): GridLayout | null {
  if (!layout.blocks.some((item) => item.appId === block.appId) || !canPlace(layout, block, block.appId)) return null;
  return { ...layout, blocks: layout.blocks.map((item) => item.appId === block.appId ? block : item) };
}

export function readLayout(value: unknown, appIds: Set<string>): GridLayout | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const candidate = value as Partial<GridLayout>;
  if (!Number.isInteger(candidate.columns) || !Number.isInteger(candidate.rows) || (candidate.columns ?? 0) < 4 || (candidate.columns ?? 0) > 6 || (candidate.rows ?? 0) < 4 || (candidate.rows ?? 0) > 12 || !Array.isArray(candidate.blocks)) return null;
  let layout: GridLayout = { columns: candidate.columns!, rows: candidate.rows!, blocks: [] };
  for (const item of candidate.blocks) {
    if (!item || typeof item !== "object" || !appIds.has(item.appId) || !Object.hasOwn(BLOCK_SIZES, item.size)) continue;
    const next = placeBlock(layout, item);
    if (next) layout = next;
  }
  return layout;
}

export function starterLayout(appIds: string[]): GridLayout {
  const placements: Omit<LayoutBlock, "appId">[] = [
    { column: 1, row: 1, size: "3x1" },
    { column: 4, row: 1, size: "1x1" },
    { column: 1, row: 2, size: "2x2" },
    { column: 3, row: 2, size: "2x2" },
  ];
  return { columns: 4, rows: 4, blocks: appIds.slice(0, 4).map((appId, index) => ({ appId, ...placements[index] })) };
}
