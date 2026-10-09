import type { Metadata } from "next";
import AtlasPrototype, { type InitialAtlasParams } from "../AtlasPrototype";

export const metadata: Metadata = { title: "3D research workspace · Interneuron Atlas" };

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<InitialAtlasParams> }) {
  return <AtlasPrototype initialParams={await searchParams} />;
}
