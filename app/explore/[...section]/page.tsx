import ResearchRoutePage, { getResearchPageMetadata } from "../../ResearchRoutePage";

export async function generateMetadata({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  return getResearchPageMetadata(`/explore/${section.join("/")}`);
}

export default async function ExplorePage({ params, searchParams }: { params: Promise<{ section: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  return <ResearchRoutePage path={`/explore/${section.join("/")}`} initialParams={await searchParams} />;
}
