import HomeClient from "@/components/HomeClient";
import { getProvidersStatus } from "@/lib/llm/orchestrator";

export const dynamic = "force-dynamic";

export default function Home() {
  const providersStatus = getProvidersStatus();
  return <HomeClient providersStatus={providersStatus} />;
}
