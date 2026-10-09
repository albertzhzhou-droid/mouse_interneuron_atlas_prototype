import { version } from "../package.json";

export const RESEARCH_ITERATION = version.match(/^(\d+\.\d+)\.\d+/)?.[1] ?? "unknown";
