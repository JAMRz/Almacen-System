import { useMutation } from "@tanstack/react-query";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { login } from "../../services/auth.service";
import { setSession } from "../../utils/auth-storage";
import type { LoginBody } from "../../utils/auth";

export function LoginRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();
  const [messageApi, contextHolder] = message.useMessage();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const token = data.access_token || data.token;
      if (!token) {
        messageApi.error("Error: No se recibió token del servidor");
        return;
      }
      setSession(token, data.usuario);
      messageApi.success("Sesión iniciada");
      navigate("/", { replace: true });
    },
    onError: () => {
      messageApi.error("Credenciales inválidas o error del servidor");
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onFinish = (values: LoginBody) => {
    mutation.mutate(values);
  };

  return (
    <>
      {contextHolder}

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 16,
        }}
      >
        <Card style={{ width: 380 }}>
          <Typography.Title level={3}>Iniciar sesión</Typography.Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Usuario"
              name="user"
              rules={[{ required: true, message: "Ingresa tu usuario" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              rules={[{ required: true, message: "Ingresa tu contraseña" }]}
            >
              <Input.Password />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
            >
              Entrar
            </Button>
          </Form>
        </Card>
      </div>
    </>
  );
}
