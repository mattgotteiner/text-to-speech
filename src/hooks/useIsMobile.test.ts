import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './useIsMobile';

type ChangeHandler = (event: MediaQueryListEvent) => void;

function createMatchMediaMock(initialMatches: boolean) {
  const listeners = new Set<ChangeHandler>();

  const mediaQueryList = {
    matches: initialMatches,
    media: '(max-width: 600px)',
    onchange: null,
    addEventListener: vi.fn((_type: string, handler: ChangeHandler) => {
      listeners.add(handler);
    }),
    removeEventListener: vi.fn((_type: string, handler: ChangeHandler) => {
      listeners.delete(handler);
    }),
    addListener: vi.fn((handler: ChangeHandler) => {
      listeners.add(handler);
    }),
    removeListener: vi.fn((handler: ChangeHandler) => {
      listeners.delete(handler);
    }),
    dispatchEvent: vi.fn(() => true),
    trigger(nextMatches: boolean) {
      mediaQueryList.matches = nextMatches;

      listeners.forEach((listener) => {
        listener({ matches: nextMatches } as MediaQueryListEvent);
      });
    },
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQueryList),
  });

  return mediaQueryList;
}

describe('useIsMobile', () => {
  it('returns false on a wide viewport', () => {
    createMatchMediaMock(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('returns true on a narrow viewport', () => {
    createMatchMediaMock(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('updates when the viewport changes', () => {
    const mediaQueryList = createMatchMediaMock(false);
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      mediaQueryList.trigger(true);
    });

    expect(result.current).toBe(true);
  });

  it('removes the event listener on unmount', () => {
    const mediaQueryList = createMatchMediaMock(false);
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalled();
  });
});
