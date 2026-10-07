import { useQuery } from '@tanstack/react-query';
import type { SwimData } from '../types';

async function fetchSwimData(): Promise<SwimData> {
  const response = await fetch('/swimming-results.json');

  if (!response.ok) {
    throw new Error(`Не удалось загрузить данные: ${response.status}`);
  }

  return response.json() as Promise<SwimData>;
}

export function useSwimData() {
  return useQuery({
    queryKey: ['swimming-results'],
    queryFn: fetchSwimData,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
