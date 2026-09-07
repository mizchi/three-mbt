import { writeFileSync } from 'node:fs';
const chunk = (data, type) => { const head = Buffer.alloc(8); head.writeUInt32LE(data.length, 0); head.writeUInt32LE(type, 4); return Buffer.concat([head, data]); };
export function writeGLB(name, model, binary) {
  const json = Buffer.from(JSON.stringify(model));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const data = Buffer.alloc(Math.ceil(binary.length / 4) * 4);
  binary.copy(data);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + padded.length + data.length, 8);
  writeFileSync(new URL(name, import.meta.url), Buffer.concat([header, chunk(padded, 0x4e4f534a), chunk(data, 0x004e4942)]));
}
