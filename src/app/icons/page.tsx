import { IconView } from "@/components/icon-view";
import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAllAppStatuses } from "@/lib/apps/status-checker";

export const dynamic = "force-dynamic";

export default async function IconsPage() {
  const apps = getAppDefinitions();
  const statuses = await checkAllAppStatuses(apps);
  return <IconView apps={apps} initialStatuses={statuses} />;
}
