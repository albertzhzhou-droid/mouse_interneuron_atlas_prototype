import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSourceViewPng } from '../app/source-view-png-raster.js';

test('actual canvas copy and each asynchronous stage require the current view', async () => {
 const oldDocument=globalThis.document,oldReader=globalThis.FileReader;
 try {
  for (const staleAt of [null,'encode','receipt','preview']) {
   let current=true, copied=false, footer=false;
   const source={width:640,height:400};
   const context={measureText:t=>({width:t.length*7}),fillRect:()=>{},drawImage:c=>{assert.equal(c,source);copied=true;},fillText:()=>{footer=true;}};
   globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context,toBlob:callback=>{assert.ok(copied&&footer);queueMicrotask(()=>{if(staleAt==='encode')current=false;callback(new Blob(['encoded actual raster']));});}})};
   globalThis.FileReader=class { readAsDataURL(){queueMicrotask(()=>{if(staleAt==='preview')current=false;this.result='data:image/png;base64,cGl4ZWxz';this.onload();});} };
   const pending=encodeSourceViewPng(source,['Source disclosure and SHA'],{pixelRatio:1,assertCurrent:()=>{if(!current)throw new Error('source view changed');},appendReceipt:async b=>{await Promise.resolve();if(staleAt==='receipt')current=false;return b;}});
   if(staleAt)await assert.rejects(pending,/source view changed/);else{const result=await pending;assert.equal(await result.blob.text(),'encoded actual raster');assert.ok(result.preview.startsWith('data:image/png'));}
  }
 } finally {globalThis.document=oldDocument;globalThis.FileReader=oldReader;}
});
test('an unavailable current source rejects before any canvas is copied',async()=>{
 await assert.rejects(encodeSourceViewPng({width:640,height:400},[],{pixelRatio:1,assertCurrent:()=>{throw new Error('unavailable');},appendReceipt:()=>{throw new Error('must not encode');}}),/unavailable/);
});
