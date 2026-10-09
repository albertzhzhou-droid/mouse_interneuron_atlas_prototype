import ResearchRoutePage, { getResearchPageMetadata } from "../../ResearchRoutePage";

export async function generateMetadata({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  return getResearchPageMetadata(`/research/${section.join("/")}`);
}

export default async function ResearchPage({ params, searchParams }: { params: Promise<{ section: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  return <ResearchRoutePage path={`/research/${section.join("/")}`} initialParams={await searchParams} />;
}
