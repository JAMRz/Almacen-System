import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getOrdenes, createOrden, updateOrden, deleteOrden } from '../services/ordenes.service';
import type { CreateOrdenDto } from '../services/ordenes.service';
import { getProductos } from '../services/productos.service';
import type { OrdenProduccion } from '../types/models';
import { formatProductLabel } from '../utils/display';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

const { Option } = Select;

export function OrdenesRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();

  const { data: ordenesResponse, isLoading } = useQuery({ queryKey: ['ordenes'], queryFn: () => getOrdenes() });
  const { data: productosResponse } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos() });
  const ordenes = ordenesResponse?.data ?? [];
  const productos = productosResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createOrden,
    onSuccess: () => {
      message.success('Orden creada');
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al crear orden'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateOrdenDto> }) => updateOrden(id, data),
    onSuccess: () => {
      message.success('Orden actualizada');
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrden,
    onSuccess: () => { message.success('Eliminada'); queryClient.invalidateQueries({ queryKey: ['ordenes'] }); },
    onError: () => message.error('Error al eliminar'),
  });

  const handleOpenModal = (orden?: OrdenProduccion) => {
    if (orden) {
      setEditingId(orden.id);
      form.setFieldsValue({
        folio: orden.folio,
        productoIds: orden.detalles
          ?.map((detalle) => detalle.producto?.id)
          .filter((productoId): productoId is number => typeof productoId === 'number'),
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => { setIsModalVisible(false); form.resetFields(); setEditingId(null); };

  const handleFinish = (values: CreateOrdenDto) => {
    if (editingId) updateMutation.mutate({ id: editingId, data: { folio: values.folio } }); // limit update to just folio for now
    else createMutation.mutate(values);
  };

  const columns = [
    createConsecutiveColumn<OrdenProduccion>(pagination),
    { title: 'Folio', dataIndex: 'folio', key: 'folio' },
    {
      title: 'Productos',
      key: 'productos',
      render: (_: any, r: OrdenProduccion) =>
        r.detalles
          ?.map((detalle) =>
            formatProductLabel(detalle.producto, {
              includeKey: true,
              includeClient: true,
            }),
          )
          .join(' | '),
    },
    {
      title: 'Acciones', key: 'acciones', width: 120,
      render: (_: any, r: OrdenProduccion) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(r)} />
          <Popconfirm title="¿Eliminar?" onConfirm={() => deleteMutation.mutate(r.id)} okText="Sí" cancelText="No">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Órdenes de Producción</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Nueva Orden</Button>
      </div>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={ordenes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: ordenesResponse?.total ?? ordenes.length,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => setPagination(resolvePaginationState(nextPagination))}
        />
      </Card>
      <Modal title={editingId ? 'Editar Orden' : 'Nueva Orden'} open={isModalVisible} onCancel={handleCloseModal} onOk={() => form.submit()} confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="folio" label="Folio" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingId && (
            <Form.Item name="productoIds" label="Productos a producir" rules={[{ required: true, message: 'Selecciona al menos un producto' }]}>
              <Select mode="multiple" showSearch optionFilterProp="children" placeholder="Busca y selecciona productos">
                {productos?.map((producto) => (
                  <Option key={producto.id} value={producto.id}>
                    {formatProductLabel(producto, {
                      includeKey: true,
                      includeClient: true,
                    })}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
