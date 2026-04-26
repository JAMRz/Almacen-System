import type { PaginatedResponse } from '../types/models';
import { api } from './api';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

const DEFAULT_LIST_LIMIT = 1000;

function buildSearchParams(params?: QueryParams) {
  const searchParams = new URLSearchParams();
  const mergedParams = {
    limit: DEFAULT_LIST_LIMIT,
    ...params,
  };

  Object.entries(mergedParams).forEach(([key, value]) => {
    if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams;
}

export async function getPaginated<T>(path: string, params?: QueryParams): Promise<PaginatedResponse<T>> {
  return api.get(path, { searchParams: buildSearchParams(params) }).json<PaginatedResponse<T>>();
}

export async function requestVoid(request: Promise<unknown>) {
  await request;
}
