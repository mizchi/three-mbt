export const video = url => {
  const element = document.createElement('video');
  element.crossOrigin = 'anonymous'; element.muted = true; element.playsInline = true;
  element.preload = 'auto'; element.src = url;
  return element;
};
function waitFor(video, event, ready, start) {
  return new Promise((resolve, reject) => {
    if (video.error) { reject(new Error(video.error.message || 'Video loading failed')); return; }
    if (ready()) { resolve(); return; }
    const cleanup = () => { video.removeEventListener(event, done); video.removeEventListener('error', failed); };
    const done = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error(video.error?.message || 'Video loading failed')); };
    video.addEventListener(event, done); video.addEventListener('error', failed);
    try { start?.(); } catch (error) { cleanup(); reject(error); }
  });
}
export const videoReady = video => waitFor(video, 'loadeddata', () => video.readyState >= 2);
export const videoSeek = async (video, time) => {
  await videoReady(video);
  if (!Number.isFinite(time) || time < 0 || time > video.duration) throw new Error('Seek time is outside the video duration');
  await waitFor(video, 'seeked', () => !video.seeking && video.currentTime === time, () => { video.currentTime = time; });
};
