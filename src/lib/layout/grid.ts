export type LayoutBlock = { appId: string; column: number; row: number; width: number; height: number };
export type GridLayout = { columns: number; rows: number; blocks: LayoutBlock[] };

export function canPlace(layout: GridLayout, block: LayoutBlock, excludeAppId?: string): boolean {
  if (!Number.isInteger(block.column) || !Number.isInteger(block.row) || !Number.isInteger(block.width) || !Number.isInteger(block.height) || block.column < 1 || block.row < 1 || block.width < 1 || block.height < 1 || block.column + block.width - 1 > layout.columns || block.row + block.height - 1 > layout.rows) return false;
  return layout.blocks.every((other) => {
    if (other.appId === excludeAppId) return true;
    return block.column + block.width <= other.column || other.column + other.width <= block.column || block.row + block.height <= other.row || other.row + other.height <= block.row;
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
    if (!item || typeof item !== "object" || typeof item.appId !== "string" || !appIds.has(item.appId)) continue;
    const stored = item as LayoutBlock & { size?: string };
    const legacyDimensions = stored.size === "1x1" ? { width: 1, height: 1 } : stored.size === "3x1" ? { width: 3, height: 1 } : stored.size === "2x2" ? { width: 2, height: 2 } : null;
    const next = placeBlock(layout, { ...item, width: item.width ?? legacyDimensions?.width, height: item.height ?? legacyDimensions?.height });
    if (next) layout = next;
  }
  return layout;
}

export function starterLayout(appIds: string[]): GridLayout {
  const placements: Omit<LayoutBlock, "appId">[] = [
    { column: 1, row: 1, width: 3, height: 1 },
    { column: 4, row: 1, width: 1, height: 1 },
    { column: 1, row: 2, width: 2, height: 2 },
    { column: 3, row: 2, width: 2, height: 2 },
  ];
  return { columns: 4, rows: 4, blocks: appIds.slice(0, 4).map((appId, index) => ({ appId, ...placements[index] })) };
}
