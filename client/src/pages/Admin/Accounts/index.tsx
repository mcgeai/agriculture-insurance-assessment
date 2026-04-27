import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../../services';

const Accounts: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  useEffect(() => { loadUsers(); }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ page, page_size: 20 });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {}
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      if (editItem) {
        await adminApi.updateUser(editItem.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createUser(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditItem(null);
      form.resetFields();
      loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '操作失败');
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ role: 'employee' });
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    form.setFieldsValue({ name: item.name, department: item.department, role: item.role });
    setModalOpen(true);
  };

  const handleToggle = async (id: number) => {
    try { await adminApi.toggleUserStatus(id); loadUsers(); } catch {}
  };

  const handleResetPwd = async (values: any) => {
    if (!resetUserId) return;
    try {
      await adminApi.resetPassword(resetUserId, values.new_password);
      message.success('密码重置成功');
      setResetModalOpen(false);
      resetForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '重置失败');
    }
  };

  const columns = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '角色', dataIndex: 'role', width: 80, render: (v: string) => <Tag color={v === 'admin' ? 'red' : 'blue'}>{v === 'admin' ? '管理员' : '员工'}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '正常' : '停用'}</Tag> },
    {
      title: '操作', width: 240, render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" onClick={() => handleToggle(r.id)}>{r.status === 'active' ? '停用' : '启用'}</Button>
          <Button size="small" onClick={() => { setResetUserId(r.id); setResetModalOpen(true); }}>重置密码</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="账号管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增账号</Button>}>
        <Table columns={columns} dataSource={users} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }} />
      </Card>

      <Modal title={editItem ? '编辑账号' : '新增账号'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditItem(null); form.resetFields(); }} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {!editItem && (
            <>
              <Form.Item name="employee_no" label="工号" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="password" label="初始密码" rules={[{ required: true }, { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/, message: '需含字母和数字，至少8位' }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select><Select.Option value="employee">员工</Select.Option><Select.Option value="admin">管理员</Select.Option></Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="重置密码" open={resetModalOpen} onCancel={() => { setResetModalOpen(false); resetForm.resetFields(); }} onOk={() => resetForm.submit()}>
        <Form form={resetForm} layout="vertical" onFinish={handleResetPwd}>
          <Form.Item name="new_password" label="新密码" rules={[{ required: true }, { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/, message: '需含字母和数字，至少8位' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Accounts;
