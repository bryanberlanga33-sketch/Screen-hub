"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addAsset,
  deleteAsset,
  getAllAssets,
  renameAsset,
  subscribeAssets,
  type AssetRecord,
} from "./assetLibrary";

interface AssetLibraryState {
  assets: AssetRecord[];
  ready: boolean;
  error: string | null;
  busy: boolean;
}

export function useAssetLibrary() {
  const [state, setState] = useState<AssetLibraryState>({
    assets: [],
    ready: false,
    error: null,
    busy: false,
  });

  const refresh = useCallback(async () => {
    try {
      const assets = await getAllAssets();
      setState((previous) => ({
        ...previous,
        assets,
        ready: true,
        error: null,
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        ready: true,
        error:
          error instanceof Error
            ? error.message
            : "Could not open the asset library.",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeAssets(() => {
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (list.length === 0) {
        return [] as string[];
      }

      setState((previous) => ({ ...previous, busy: true, error: null }));
      const ids: string[] = [];
      try {
        for (const file of list) {
          const meta = await addAsset(file);
          ids.push(meta.id);
        }
        await refresh();
      } catch (error) {
        setState((previous) => ({
          ...previous,
          error:
            error instanceof Error ? error.message : "Upload failed.",
        }));
      } finally {
        setState((previous) => ({ ...previous, busy: false }));
      }
      return ids;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteAsset(id);
      await refresh();
    },
    [refresh],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await renameAsset(id, name);
      await refresh();
    },
    [refresh],
  );

  return {
    assets: state.assets,
    ready: state.ready,
    error: state.error,
    busy: state.busy,
    upload,
    remove,
    rename,
  };
}
