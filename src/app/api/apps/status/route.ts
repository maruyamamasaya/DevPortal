import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAllAppStatuses } from "@/lib/apps/status-checker";
import { isManaged } from "@/lib/apps/process-manager";
import type { StatusResponse } from "@/lib/apps/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const apps = getAppDefinitions();
  const statuses = (await checkAllAppStatuses(apps)).map((status) => ({ ...status, managed: isManaged(status.id) }));
  const response: StatusResponse = {
    statuses,
    checkedAt: new Date().toISOString(),
  };

  return Response.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
