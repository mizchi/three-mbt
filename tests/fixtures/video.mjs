// Optional fixture regeneration; ffmpeg with libvpx-vp9 is required.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=red:s=16x16:r=10:d=1',
  '-f', 'lavfi', '-i', 'color=c=blue:s=16x16:r=10:d=1',
  '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]',
  '-c:v', 'libvpx-vp9', '-lossless', '1', '-y', fileURLToPath(new URL('colors.webm', import.meta.url)),
], { stdio: 'inherit' });
