type Listener = (count: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener(pending));
};

export const loadingBus = {
  increment() {
    pending += 1;
    emit();
  },
  decrement() {
    pending = Math.max(0, pending - 1);
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(pending);
    return () => {
      listeners.delete(listener);
    };
  },
};
