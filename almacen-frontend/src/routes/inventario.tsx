import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { getInventarios } from '../services/inventario.service';
import type { Inventario } from '../types/models';
import { formatProductLabel } from '../utils/display';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

export function InventarioRoute() {
  const [activeTab, setActiveTab] = useState('con-stock');
  const [conStockPagination, setConStockPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [sinStockPagination, setSinStockPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });

  const { data: inventariosResponse, isLoading } = useQuery({
    queryKey: ['inventario'],
    queryFn: () => getInventarios(),
  });

  const inventarios = inventariosResponse?.data ?? [];

  const { conStock, sinStock } = useMemo(() => {
    return inventarios.reduce(
      (acc, inventario) => {
        const tieneStock =
          inventario.sinStock === undefined
            ? Number(inventario.totalUnidades) > 0 || Number(inventario.totalKg) > 0
            : !inventario.sinStock;

        if (tieneStock) {
          acc.conStock.push(inventario);
        } else {
          acc.sinStock.push(inventario);
        }

        return acc;
      },
      { conStock: [] as Inventario[], sinStock: [] as Inventario[] },
    );
  }, [inventarios]);

  const columns = [
    createConsecutiveColumn<Inventario>(
      activeTab === 'con-stock' ? conStockPagination : sinStockPagination,
    ),
    {
      title: 'Producto',
      key: 'producto',
      render: (_: unknown, record: Inventario) =>
        formatProductLabel(record.producto, {
          includeKey: true,
          includeClient: true,
        }),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_: unknown, record: Inventario) =>
        record.producto?.cliente?.nombre ?? 'N/A',
    },
    { title: 'Total Unidades', dataIndex: 'totalUnidades', key: 'totalUnidades' },
    {
      title: 'Total Kg',
      dataIndex: 'totalKg',
      key: 'totalKg',
      render: (value: number | string | null | undefined) =>
        value != null ? Number(value).toFixed(2) : '-',
    },
    { title: 'Actualizado', dataIndex: 'actualizadoEn', key: 'actualizadoEn' },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Inventario Global
      </Typography.Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'con-stock',
            label: `Con stock (${conStock.length})`,
            children: (
              <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={conStock}
                  columns={columns}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    current: conStockPagination.current,
                    pageSize: conStockPagination.pageSize,
                    total: conStock.length,
                    showSizeChanger: true,
                  }}
                  onChange={(nextPagination) =>
                    setConStockPagination(resolvePaginationState(nextPagination))
                  }
                  locale={{ emptyText: 'No hay productos con stock disponible.' }}
                />
              </Card>
            ),
          },
          {
            key: 'sin-stock',
            label: `Sin stock (${sinStock.length})`,
            children: (
              <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={sinStock}
                  columns={columns}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    current: sinStockPagination.current,
                    pageSize: sinStockPagination.pageSize,
                    total: sinStock.length,
                    showSizeChanger: true,
                  }}
                  onChange={(nextPagination) =>
                    setSinStockPagination(resolvePaginationState(nextPagination))
                  }
                  locale={{ emptyText: 'No hay productos sin stock.' }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
