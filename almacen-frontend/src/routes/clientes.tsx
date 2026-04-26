import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Space, Table, Typography } from 'antd';
import { useState } from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clientes.service';
import type { Cliente } from '../types/models';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

export function ClientesRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();

  const { data: clientesResponse, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  });
  const clientes = clientesResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      message.success('Cliente creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al crear cliente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre: string } }) => updateCliente(id, data),
    onSuccess: () => {
      message.success('Cliente actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar cliente'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      message.success('Cliente eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: () => message.error('Error al eliminar cliente'),
  });

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente.id);
      form.setFieldsValue({ nombre: cliente.nombre });
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

  const handleFinish = (values: { nombre: string }) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    createConsecutiveColumn<Cliente>(pagination),
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_: any, record: Cliente) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="¿Eliminar cliente?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
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
        <Typography.Title level={3} style={{ margin: 0 }}>
          Clientes
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Nuevo Cliente
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={clientes}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: clientesResponse?.total ?? clientes.length,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => setPagination(resolvePaginationState(nextPagination))}
        />
      </Card>

      <Modal
        title={editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="nombre"
            label="Nombre del cliente"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input placeholder="Ej. Empresa SA de CV" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
