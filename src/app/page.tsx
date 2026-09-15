import { DevHub } from "@/components/dev-hub";
import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAllAppStatuses } from "@/lib/apps/status-checker";
import { isManaged } from "@/lib/apps/process-manager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const apps = getAppDefinitions();
  const statuses = (await checkAllAppStatuses(apps)).map((status) => ({ ...status, managed: isManaged(status.id) }));

  return <DevHub apps={apps} initialStatuses={statuses} />;
}
