import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, InputNumber, message, Modal, Popconfirm, Select, Space, Table, Typography, Tag } from 'antd';
import { useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { createMovimiento, deleteMovimiento, getMovimientos, updateMovimiento } from '../services/movimientos.service';
import type { CreateMovimientoDto } from '../services/movimientos.service';
import { getProductos } from '../services/productos.service';
import { getTarimas } from '../services/tarimas.service';
import { TipoMovimientoList, UnidadEntregaList } from '../types/models';
import type { Movimiento, TipoMovimiento } from '../types/models';
import { formatProductLabel, formatTarimaLabel } from '../utils/display';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

const { Option } = Select;

export function MovimientosRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();
  const selectedProductoId = Form.useWatch('productoId', form);

  const { data: movimientosResponse, isLoading } = useQuery({ queryKey: ['movimientos'], queryFn: () => getMovimientos() });
  const { data: productosResponse } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos() });
  const { data: tarimasResponse, isLoading: isLoadingTarimas } = useQuery({
    queryKey: ['tarimas', 'selector', selectedProductoId],
    queryFn: () => getTarimas({ productoId: selectedProductoId! }),
    enabled: isModalVisible && !!selectedProductoId,
  });

  const movimientos = movimientosResponse?.data ?? [];
  const productos = productosResponse?.data ?? [];
  const tarimas = tarimasResponse?.data ?? [];

  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    queryClient.invalidateQueries({ queryKey: ['inventario'] });
  };

  const createMutation = useMutation({
    mutationFn: createMovimiento,
    onSuccess: () => {
      message.success('Movimiento registrado');
      invalidateRelatedQueries();
      handleCloseModal();
    },
    onError: () => message.error('Error al registrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMovimientoDto> }) => updateMovimiento(id, data),
    onSuccess: () => {
      message.success('Movimiento actualizado');
      invalidateRelatedQueries();
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMovimiento,
    onSuccess: () => {
      message.success('Movimiento eliminado');
      invalidateRelatedQueries();
    },
    onError: () => message.error('Error al eliminar'),
  });

  const handleOpenModal = (movimiento?: Movimiento) => {
    if (movimiento) {
      setEditingId(movimiento.id);
      form.setFieldsValue({
        tipo: movimiento.tipo,
        productoId: movimiento.producto?.id,
        tarimaId: movimiento.tarima?.id,
        unidades: movimiento.unidades,
        kg: movimiento.kg,
        unidadFacturacion: movimiento.unidadFacturacion,
        notas: movimiento.notas,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleFinish = (values: CreateMovimientoDto) => {
    const payload: CreateMovimientoDto = {
      ...values,
      tarimaId: values.tarimaId ?? null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const columns = [
    createConsecutiveColumn<Movimiento>(pagination),
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', render: (tipo: TipoMovimiento) => <Tag color={tipo === 'ENTRADA' ? 'green' : 'red'}>{tipo}</Tag> },
    {
      title: 'Producto',
      key: 'producto',
      render: (_: unknown, record: Movimiento) =>
        formatProductLabel(record.producto, {
          includeKey: true,
          includeClient: true,
        }),
    },
    {
      title: 'Tarima',
      key: 'tarima',
      render: (_: unknown, record: Movimiento) =>
        record.tarima ? formatTarimaLabel(record.tarima) : 'N/A',
    },
    { title: 'Unidades', dataIndex: 'unidades', key: 'unidades' },
    { title: 'Kg', dataIndex: 'kg', key: 'kg', render: (value: number | string | null | undefined) => value != null ? Number(value).toFixed(2) : '-' },
    { title: 'Notas', dataIndex: 'notas', key: 'notas' },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: unknown, record: Movimiento) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Eliminar movimiento?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Si" cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Historial de Movimientos</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Nuevo Movimiento
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={movimientos}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: movimientosResponse?.total ?? movimientos.length,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => setPagination(resolvePaginationState(nextPagination))}
        />
      </Card>

      <Modal
        title={editingId ? 'Editar Movimiento' : 'Registrar Movimiento Manual'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select>
              {TipoMovimientoList.map((value) => <Option key={value} value={value}>{value}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="productoId" label="Producto" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="children"
              onChange={() => form.setFieldValue('tarimaId', null)}
            >
              {productos.map((producto) => (
                <Option key={producto.id} value={producto.id}>
                  {formatProductLabel(producto, {
                    includeKey: true,
                    includeClient: true,
                  })}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tarimaId" label="Tarima (Opcional)">
            <Select
              showSearch
              allowClear
              optionFilterProp="children"
              disabled={!selectedProductoId}
              loading={isLoadingTarimas}
              placeholder={
                selectedProductoId
                  ? 'Selecciona una tarima del producto'
                  : 'Primero selecciona un producto'
              }
            >
              {tarimas.map((tarima) => (
                <Option key={tarima.id} value={tarima.id}>
                  {`${formatTarimaLabel(tarima)} | ${Number(tarima.totalKg).toFixed(2)} Kg`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unidades" label="Unidades" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="kg" label="Peso (Kg)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="unidadFacturacion" label="Unidad Facturacion" rules={[{ required: true }]}>
            <Select>
              {UnidadEntregaList.map((value) => <Option key={value} value={value}>{value}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="notas" label="Notas">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
