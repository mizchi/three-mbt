import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
const chunk = (type, data) => {
  const head = Buffer.alloc(4); head.writeUInt32BE(data.length);
  const payload = Buffer.concat([Buffer.from(type), data]);
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(payload));
  return Buffer.concat([head, payload, tail]);
};
for (const [name, rgba] of [['red',[255,0,0,255]], ['blue',[0,0,255,255]]]) {
  const header = Buffer.alloc(13); header.writeUInt32BE(1,0); header.writeUInt32BE(1,4); header[8]=8; header[9]=6;
  writeFileSync(new URL(`${name}.png`, import.meta.url), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',header), chunk('IDAT',deflateSync(Buffer.from([0,...rgba]))), chunk('IEND',Buffer.alloc(0))]));
}
