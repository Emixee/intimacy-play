/**
 * Hook pour optimiser les FlatList
 * 
 * Fournit des props optimisées pour les FlatList
 * et gère la pagination/infinite scroll
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { LIST_CONFIG } from "../utils/performanceConfig";

interface UseOptimizedListOptions<T> {
  /** Données initiales */
  data: T[];
  /** Clé unique pour chaque élément */
  keyExtractor: (item: T, index: number) => string;
  /** Fonction pour charger plus de données */
  onLoadMore?: () => Promise<void>;
  /** Y a-t-il plus de données à charger ? */
  hasMore?: boolean;
  /** Nombre d'éléments estimés */
  estimatedItemCount?: number;
}

interface UseOptimizedListReturn<T> {
  /** Props optimisées pour FlatList */
  flatListProps: {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    onEndReached: () => void;
    onEndReachedThreshold: number;
    windowSize: number;
    maxToRenderPerBatch: number;
    updateCellsBatchingPeriod: number;
    removeClippedSubviews: boolean;
    initialNumToRender: number;
    getItemLayout?: (data: T[] | null | undefined, index: number) => {
      length: number;
      offset: number;
      index: number;
    };
  };
  /** État de chargement */
  isLoadingMore: boolean;
  /** Rafraîchir la liste */
  refresh: () => void;
}

export function useOptimizedList<T>(
  options: UseOptimizedListOptions<T>
): UseOptimizedListReturn<T> {
  const {
    data,
    keyExtractor,
    onLoadMore,
    hasMore = false,
    estimatedItemCount,
  } = options;

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  // Handler pour charger plus de données
  const handleEndReached = useCallback(async () => {
    if (!onLoadMore || !hasMore || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);

    try {
      await onLoadMore();
    } catch (error) {
      console.error("[useOptimizedList] Error loading more:", error);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [onLoadMore, hasMore]);

  // Rafraîchir la liste
  const refresh = useCallback(() => {
    loadingRef.current = false;
  }, []);

  // Props optimisées mémorisées
  const flatListProps = useMemo(() => ({
    data,
    keyExtractor,
    onEndReached: handleEndReached,
    onEndReachedThreshold: LIST_CONFIG.LOAD_MORE_THRESHOLD,
    windowSize: LIST_CONFIG.WINDOW_SIZE,
    maxToRenderPerBatch: LIST_CONFIG.MAX_TO_RENDER_PER_BATCH,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
    initialNumToRender: Math.min(data.length, LIST_CONFIG.PAGE_SIZE),
  }), [data, keyExtractor, handleEndReached]);

  return {
    flatListProps,
    isLoadingMore,
    refresh,
  };
}

/**
 * Hook pour créer un getItemLayout optimisé
 * Utile quand tous les éléments ont la même hauteur
 */
export function useGetItemLayout(itemHeight: number) {
  return useCallback(
    (_data: any[] | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );
}

/**
 * Hook pour créer un keyExtractor basé sur un champ id
 */
export function useKeyExtractor<T extends { id: string }>(idField: keyof T = "id") {
  return useCallback(
    (item: T, index: number) => String(item[idField]) || String(index),
    [idField]
  );
}
