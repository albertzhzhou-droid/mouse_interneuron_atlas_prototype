import type { ComparativeIndex, ComparativePayload } from './comparative-swc-reference.js';
import type { ComparativeViewDocument } from './comparative-swc-view-replay.js';
export type ComparativePngOptions={index:ComparativeIndex;payload:ComparativePayload;applicationVersion:string;rendererVersion:string|null};
export function comparativeSwcPngCaptions(document:ComparativeViewDocument,options:ComparativePngOptions):string[];
export function appendComparativeSwcPng(blob:Blob,document:ComparativeViewDocument,options:ComparativePngOptions):Promise<Blob>;
export function encodeComparativeSwcPng(canvas:HTMLCanvasElement,document:ComparativeViewDocument,options:ComparativePngOptions,assertCurrent:()=>void):Promise<{blob:Blob;preview:string}>;
