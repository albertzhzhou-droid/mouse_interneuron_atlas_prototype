import ResearchRoutePage, { getResearchPageMetadata } from "../ResearchRoutePage";

export const metadata = getResearchPageMetadata("/sources");

export default async function SourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ResearchRoutePage path="/sources" initialParams={await searchParams} />;
}
