import { DevHub } from "@/components/dev-hub";
import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAllAppStatuses } from "@/lib/apps/status-checker";

export const dynamic = "force-dynamic";

export default async function Home() {
  const apps = getAppDefinitions();
  const statuses = await checkAllAppStatuses(apps);

  return <DevHub apps={apps} initialStatuses={statuses} />;
}
