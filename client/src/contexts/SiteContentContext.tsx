import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface SiteContentContextValue {
  /** Get the current value for a content key, falling back to the default */
  get: (key: string, defaultValue: string) => string;
  /** Update a content key (triggers optimistic update + server save) */
  set: (key: string, value: string) => void;
  /** Reset a content key to its default (delete the override) */
  reset: (key: string) => void;
  /** Check if a content key has been overridden from its default */
  hasOverride: (key: string) => boolean;
  /** Whether the current user can edit content */
  canEdit: boolean;
  /** Whether content is still loading */
  isLoading: boolean;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  get: (_key, defaultValue) => defaultValue,
  set: () => {},
  reset: () => {},
  hasOverride: () => false,
  canEdit: false,
  isLoading: true,
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";

  const utils = trpc.useUtils();
  const { data: contentMap, isLoading } = trpc.siteContent.getAll.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const updateMutation = trpc.siteContent.update.useMutation({
    onMutate: async ({ contentKey, value }) => {
      // Cancel outgoing refetches
      await utils.siteContent.getAll.cancel();
      // Snapshot previous value
      const prev = utils.siteContent.getAll.getData();
      // Optimistically update
      utils.siteContent.getAll.setData(undefined, (old) => ({
        ...old,
        [contentKey]: value,
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prev) {
        utils.siteContent.getAll.setData(undefined, context.prev);
      }
    },
    onSettled: () => {
      utils.siteContent.getAll.invalidate();
    },
  });

  const get = useCallback(
    (key: string, defaultValue: string): string => {
      if (!contentMap) return defaultValue;
      return contentMap[key] ?? defaultValue;
    },
    [contentMap]
  );

  const set = useCallback(
    (key: string, value: string) => {
      if (!canEdit) return;
      updateMutation.mutate({ contentKey: key, value });
    },
    [canEdit, updateMutation]
  );

  const resetMutation = trpc.siteContent.reset.useMutation({
    onMutate: async ({ contentKey }) => {
      await utils.siteContent.getAll.cancel();
      const prev = utils.siteContent.getAll.getData();
      utils.siteContent.getAll.setData(undefined, (old) => {
        if (!old) return old;
        const next = { ...old };
        delete next[contentKey];
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        utils.siteContent.getAll.setData(undefined, context.prev);
      }
    },
    onSettled: () => {
      utils.siteContent.getAll.invalidate();
    },
  });

  const reset = useCallback(
    (key: string) => {
      if (!canEdit) return;
      resetMutation.mutate({ contentKey: key });
    },
    [canEdit, resetMutation]
  );

  const hasOverride = useCallback(
    (key: string): boolean => {
      if (!contentMap) return false;
      return key in contentMap;
    },
    [contentMap]
  );

  const value = useMemo(
    () => ({ get, set, reset, hasOverride, canEdit, isLoading }),
    [get, set, reset, hasOverride, canEdit, isLoading]
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
