import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Typography, Tag } from 'antd';
import { useState } from 'react';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuarios.service';
import type { CreateUsuarioDto } from '../services/usuarios.service';
import { RolUsuarioList } from '../types/models';
import type { RolUsuario, Usuario } from '../types/models';
import { useSession } from '../hooks/useSession';

const { Option } = Select;

export function UsuariosRoute() {
  const queryClient = useQueryClient();
  const { usuario: currentUser } = useSession();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data: usuariosResponse, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: () => getUsuarios() });
  const usuarios = usuariosResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => { message.success('Usuario creado'); queryClient.invalidateQueries({ queryKey: ['usuarios'] }); handleCloseModal(); },
    onError: () => message.error('Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUsuarioDto> }) => updateUsuario(id, data),
    onSuccess: () => { message.success('Usuario actualizado'); queryClient.invalidateQueries({ queryKey: ['usuarios'] }); handleCloseModal(); },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => { message.success('Eliminado'); queryClient.invalidateQueries({ queryKey: ['usuarios'] }); },
    onError: () => message.error('Error al eliminar'),
  });

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingId(usuario.id);
      form.setFieldsValue({ user: usuario.user, rol: usuario.rol });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => { setIsModalVisible(false); form.resetFields(); setEditingId(null); };

  const handleFinish = (values: CreateUsuarioDto) => {
    if (editingId) updateMutation.mutate({ id: editingId, data: values });
    else createMutation.mutate(values);
  };

  const columns = [
    { title: 'Usuario', dataIndex: 'user', key: 'user' },
    { title: 'Rol', dataIndex: 'rol', key: 'rol', render: (st: RolUsuario) => <Tag color={st === 'SUPERVISOR' ? 'purple' : st === 'OPERADOR' ? 'blue' : 'default'}>{st}</Tag> },
    { title: 'Creado En', dataIndex: 'creadoEn', key: 'creadoEn' },
    {
      title: 'Acciones', key: 'acciones', width: 120,
      render: (_: any, r: Usuario) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(r)} />
          {currentUser?.id !== r.id && (
            <Popconfirm title="¿Eliminar usuario?" onConfirm={() => deleteMutation.mutate(r.id)} okText="Sí">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Usuarios del Sistema</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Nuevo Usuario</Button>
      </div>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={usuarios}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, total: usuariosResponse?.total ?? 0 }}
        />
      </Card>
      <Modal title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'} open={isModalVisible} onCancel={handleCloseModal} onOk={() => form.submit()} confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="user" label="Nombre de Usuario" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Contraseña" rules={[{ required: !editingId }]} extra={editingId ? "Opional si no deseas cambiarla" : ""}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="rol" label="Rol" rules={[{ required: true }]}>
            <Select>
              {RolUsuarioList.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
