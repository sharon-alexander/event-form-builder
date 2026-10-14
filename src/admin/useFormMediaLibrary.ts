import { useCallback, useRef, useState } from "react";
import {
  listLocationMedia,
  MEDIA_PAGE_SIZE,
  type LibraryMedia,
} from "./mediaLibraryApi";

export interface FormMediaLibrary {
  items: LibraryMedia[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loaded: boolean;
  error: string | null;
  ensureLoaded: () => Promise<void>;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  remember: (rows: LibraryMedia[]) => void;
  replace: (row: LibraryMedia) => void;
}

function dedupe(rows: LibraryMedia[]): LibraryMedia[] {
  const seen = new Set<string>();
  const items: LibraryMedia[] = [];
  for (const row of rows) {
    if (seen.has(row.id) || seen.has(row.src)) continue;
    seen.add(row.id);
    seen.add(row.src);
    items.push(row);
  }
  return items;
}

export function useFormMediaLibrary(locationId: string | null): FormMediaLibrary {
  const [items, setItems] = useState<LibraryMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationRef = useRef(locationId);
  const loadedRef = useRef(false);
  const hasMoreRef = useRef(false);
  const fetchedCountRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const loadMoreBlockedRef = useRef(false);
  const pendingRef = useRef<LibraryMedia[]>([]);
  const inflightRef = useRef<Promise<void> | null>(null);
  const requestGen = useRef(0);
  const [trackedId, setTrackedId] = useState(locationId);

  if (trackedId !== locationId) {
    setTrackedId(locationId);
    locationRef.current = locationId;
    loadedRef.current = false;
    hasMoreRef.current = false;
    fetchedCountRef.current = 0;
    loadingMoreRef.current = false;
    loadMoreBlockedRef.current = false;
    pendingRef.current = [];
    inflightRef.current = null;
    requestGen.current += 1;
    setItems([]);
    setLoading(false);
    setLoadingMore(false);
    setHasMore(false);
    setLoaded(false);
    setError(null);
  }

  const applyFirstPage = useCallback((page: LibraryMedia[]) => {
    const pending = pendingRef.current;
    pendingRef.current = [];
    fetchedCountRef.current = page.length;
    const more = page.length === MEDIA_PAGE_SIZE;
    hasMoreRef.current = more;
    loadedRef.current = true;
    setItems(dedupe([...pending, ...page]));
    setHasMore(more);
    setLoaded(true);
    setError(null);
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (!locationId || loadedRef.current) return;
    if (inflightRef.current) return inflightRef.current;
    const requestedId = locationId;
    const gen = ++requestGen.current;
    const run = (async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await listLocationMedia(requestedId, 0);
        if (locationRef.current !== requestedId || requestGen.current !== gen) return;
        applyFirstPage(page);
      } catch (err) {
        if (locationRef.current !== requestedId || requestGen.current !== gen) return;
        setError(err instanceof Error ? err.message : "Could not load media.");
      } finally {
        if (requestGen.current === gen) {
          inflightRef.current = null;
          if (locationRef.current === requestedId) setLoading(false);
        }
      }
    })();
    inflightRef.current = run;
    return run;
  }, [applyFirstPage, locationId]);

  const loadMore = useCallback(async () => {
    if (!locationId || !loadedRef.current || !hasMoreRef.current || loadingMoreRef.current) return;
    if (loadMoreBlockedRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const requestedId = locationId;
    const gen = requestGen.current;
    const offset = fetchedCountRef.current;
    try {
      const page = await listLocationMedia(requestedId, offset);
      if (locationRef.current !== requestedId || requestGen.current !== gen) return;
      fetchedCountRef.current = offset + page.length;
      const more = page.length === MEDIA_PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
      setError(null);
      setItems((prev) => dedupe([...prev, ...page]));
    } catch (err) {
      if (locationRef.current !== requestedId || requestGen.current !== gen) return;
      loadMoreBlockedRef.current = true;
      setError(err instanceof Error ? err.message : "Could not load more media.");
    } finally {
      if (requestGen.current === gen) {
        loadingMoreRef.current = false;
        if (locationRef.current === requestedId) setLoadingMore(false);
      }
    }
  }, [locationId]);

  const reload = useCallback(async () => {
    if (!locationId) return;
    requestGen.current += 1;
    loadedRef.current = false;
    inflightRef.current = null;
    loadingMoreRef.current = false;
    loadMoreBlockedRef.current = false;
    setLoadingMore(false);
    await ensureLoaded();
  }, [ensureLoaded, locationId]);

  const remember = useCallback((rows: LibraryMedia[]) => {
    if (rows.length === 0 || locationId !== locationRef.current) return;
    if (!loadedRef.current) {
      pendingRef.current = dedupe([...rows, ...pendingRef.current]);
      return;
    }
    setItems((prev) => dedupe([...rows, ...prev]));
  }, [locationId]);

  const replace = useCallback((row: LibraryMedia) => {
    if (locationId !== locationRef.current) return;
    pendingRef.current = pendingRef.current.map((item) => (item.id === row.id ? row : item));
    setItems((prev) => prev.map((item) => (item.id === row.id ? row : item)));
  }, [locationId]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    loaded,
    error,
    ensureLoaded,
    loadMore,
    reload,
    remember,
    replace,
  };
}
