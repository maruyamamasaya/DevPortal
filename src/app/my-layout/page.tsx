import { MyLayout } from "@/components/my-layout";
import { getAppDefinitions } from "@/lib/apps/definitions";
import { checkAllAppStatuses } from "@/lib/apps/status-checker";

export const dynamic = "force-dynamic";

export default async function MyLayoutPage() {
  const apps = getAppDefinitions();
  const statuses = await checkAllAppStatuses(apps);
  return <MyLayout apps={apps} initialStatuses={statuses} />;
}
