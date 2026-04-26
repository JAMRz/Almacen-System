import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/productos.service';
import type { CreateProductoDto } from '../services/productos.service';
import { getClientes } from '../services/clientes.service';
import { TipoMaterialList, UnidadEntregaList } from '../types/models';
import type { Producto } from '../types/models';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

const { Option } = Select;

export function ProductosRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();

  const { data: productosResponse, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: () => getProductos(),
  });

  const { data: clientesResponse } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  });
  const productos = productosResponse?.data ?? [];
  const clientes = clientesResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createProducto,
    onSuccess: () => {
      message.success('Producto creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al crear producto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProductoDto> }) => updateProducto(id, data),
    onSuccess: () => {
      message.success('Producto actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar producto'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProducto,
    onSuccess: () => {
      message.success('Producto eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
    onError: () => message.error('Error al eliminar producto'),
  });

  const handleOpenModal = (producto?: Producto) => {
    if (producto) {
      setEditingId(producto.id);
      form.setFieldsValue({
        nombre: producto.nombre,
        presentacion: producto.presentacion,
        medidas: producto.medidas,
        tipoMaterial: producto.tipoMaterial,
        unidadEntrega: producto.unidadEntrega,
        clienteId: producto.cliente?.id,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleFinish = (values: CreateProductoDto) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    createConsecutiveColumn<Producto>(pagination),
    { title: 'Clave', dataIndex: 'clave', key: 'clave', width: 120 },
    { title: 'Nombre', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Presentación', dataIndex: 'presentacion', key: 'presentacion' },
    { title: 'Medida', dataIndex: 'medidas', key: 'medidas' },
    { title: 'Cliente', key: 'cliente', render: (_: any, record: Producto) => record.cliente?.nombre || 'N/A' },
    { title: 'Material', dataIndex: 'tipoMaterial', key: 'tipoMaterial' },
    { title: 'U. Entrega', dataIndex: 'unidadEntrega', key: 'unidadEntrega' },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: any, record: Producto) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm
            title="¿Eliminar producto?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Sí" cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Productos</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Nuevo Producto</Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={productos}
          columns={columns}
          rowKey="id"
          loading={isLoading || createMutation.isPending}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: productosResponse?.total ?? productos.length,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => setPagination(resolvePaginationState(nextPagination))}
        />
      </Card>

      <Modal title={editingId ? 'Editar Producto' : 'Nuevo Producto'} open={isModalVisible} onCancel={handleCloseModal} onOk={() => form.submit()} confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="clienteId" label="Cliente" rules={[{ required: true }]}>
            <Select placeholder="Seleccionar cliente">
              {clientes?.map(c => <Option key={c.id} value={c.id}>{c.nombre}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="nombre" label="Nombre del producto" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="presentacion" label="Presentación (Ej. Rollo, Caja)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="medidas" label="Medida" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tipoMaterial" label="Material" rules={[{ required: true }]}>
            <Select>
              {TipoMaterialList.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="unidadEntrega" label="Unidad de Entrega" rules={[{ required: true }]}>
            <Select>
              {UnidadEntregaList.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
