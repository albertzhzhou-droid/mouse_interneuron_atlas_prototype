import AtlasPrototype, { type InitialAtlasParams } from "./AtlasPrototype";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<InitialAtlasParams>;
}) {
  return <AtlasPrototype initialParams={await searchParams} />;
}
