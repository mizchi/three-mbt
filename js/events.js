// Retain the exact listener identity; releasing a subscription is idempotent.
function subscribe(target, type, listener) {
  target.addEventListener(type, listener);
  return () => {
    if (target === null) return;
    target.removeEventListener(type, listener);
    target = null;
    listener = null;
  };
}

export const onAdded = (target, callback) => subscribe(target, 'added', () => callback());
export const onRemoved = (target, callback) => subscribe(target, 'removed', () => callback());
export const onChildAdded = (target, callback) => subscribe(target, 'childadded', event => callback(event.child));
export const onChildRemoved = (target, callback) => subscribe(target, 'childremoved', event => callback(event.child));
export const onFinished = (target, callback) => subscribe(target, 'finished', event => callback(event.action, event.direction));
export const onLoop = (target, callback) => subscribe(target, 'loop', event => callback(event.action, event.loopDelta));
export const onDispose = (target, callback) => subscribe(target, 'dispose', () => callback());
export const onChange = (target, callback) => subscribe(target, 'change', () => callback());
export const onStart = (target, callback) => subscribe(target, 'start', () => callback());
export const onEnd = (target, callback) => subscribe(target, 'end', () => callback());

export const onObjectChange = (target, callback) => subscribe(target, 'objectChange', () => callback());
export const onDraggingChanged = (target, callback) => subscribe(target, 'dragging-changed', event => callback(event.value));
export const onLock = (target, callback) => subscribe(target, 'lock', () => callback());
export const onUnlock = (target, callback) => subscribe(target, 'unlock', () => callback());
