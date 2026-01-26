// Lightweight in-app event bus for simple pub/sub

const _listeners = new Set();

export const EventBus = {
  on(handler) {
    _listeners.add(handler);
    return () => EventBus.off(handler);
  },
  off(handler) {
    _listeners.delete(handler);
  },
  emit(payload) {
    for (const h of Array.from(_listeners)) {
      try {
        h(payload);
      } catch (e) {
        // swallow to avoid breaking event dispatch
      }
    }
  },
};

// Convenience helpers for common events
export function publishProfileUpdate(update) {
  EventBus.emit({ type: 'profileUpdated', payload: update });
}

export function subscribeProfileUpdate(handler) {
  // Caller gets an unsubscribe function
  return EventBus.on(({ type, payload }) => {
    if (type === 'profileUpdated') {
      handler(payload);
    }
  });
}
