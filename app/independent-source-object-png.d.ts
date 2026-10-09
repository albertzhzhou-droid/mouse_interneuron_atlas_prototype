import type { IndependentPayload } from './independent-source-workspace-types';
import type { IndependentObjectViewDocument } from './independent-source-object-view.js';
export function independentObjectPngCaptions(document:IndependentObjectViewDocument,payload:IndependentPayload,applicationVersion:string):string[];
export function appendIndependentObjectPng(blob:Blob,document:IndependentObjectViewDocument,payload:IndependentPayload,applicationVersion:string):Promise<Blob>;
export function encodeIndependentObjectPng(canvas:HTMLCanvasElement|null,document:IndependentObjectViewDocument,payload:IndependentPayload,applicationVersion:string,assertCurrent:()=>void):Promise<{blob:Blob;preview:string}>;
