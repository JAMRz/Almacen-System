import type { TableColumnsType, TablePaginationConfig } from 'antd';

export const DEFAULT_TABLE_PAGE_SIZE = 15;

export type TablePaginationState = {
  current: number;
  pageSize: number;
};

export function createConsecutiveColumn<T>(
  pagination: TablePaginationState,
  title = 'N°',
): TableColumnsType<T>[number] {
  return {
    title,
    key: 'rowNumber',
    width: 72,
    align: 'center',
    render: (_: unknown, __: T, index: number) =>
      (pagination.current - 1) * pagination.pageSize + index + 1,
  };
}

export function resolvePaginationState(
  pagination?: TablePaginationConfig,
): TablePaginationState {
  return {
    current: pagination?.current ?? 1,
    pageSize: pagination?.pageSize ?? DEFAULT_TABLE_PAGE_SIZE,
  };
}
