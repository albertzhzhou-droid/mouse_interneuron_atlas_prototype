import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const original = fs.promises.readFile;
fs.promises.readFile = async function(file, options) {
 if (typeof file !== 'string' && !(file instanceof URL)) return original(file, options);
 if (options?.signal?.aborted) throw new DOMException('Read aborted','AbortError');
 const fd=fs.openSync(file,'r');
 try {
  const before=fs.fstatSync(fd), out=Buffer.alloc(before.size);
  for(let offset=0;offset<out.length;) {
   const n=fs.readSync(fd,out,offset,Math.min(4096,out.length-offset),offset);
   if(!n) throw new Error('Incomplete exact positional read: '+file);offset+=n;
  }
  const after=fs.fstatSync(fd); if(before.size!==after.size||before.mtimeMs!==after.mtimeMs) throw new Error('Source changed during exact read: '+file);
  const encoding=typeof options==='string'?options:options?.encoding;
  return encoding?out.toString(encoding):out;
 } finally {fs.closeSync(fd);}
};
syncBuiltinESMExports();
fs.promises.readdir=async (...args)=>fs.readdirSync(...args);
fs.promises.writeFile=async (...args)=>fs.writeFileSync(...args);
syncBuiltinESMExports();
