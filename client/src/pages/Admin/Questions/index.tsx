import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { adminApi } from '../../../services';
import { DIMENSION_LABELS } from '../../../types';

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dimFilter, setDimFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadQuestions(); }, [page, dimFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listQuestions({ dimension: dimFilter, page, page_size: 20 });
      setQuestions(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {}
    setLoading(false);
  };

  const handleSave = async (values: any) => {
    try {
      if (editItem) {
        await adminApi.updateQuestion(editItem.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createQuestion(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditItem(null);
      form.resetFields();
      loadQuestions();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '操作失败');
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleToggle = async (id: number) => {
    try {
      await adminApi.toggleQuestionStatus(id);
      loadQuestions();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteQuestion(id);
      message.success('已删除');
      loadQuestions();
    } catch {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '维度', dataIndex: 'dimension', width: 100, render: (v: string) => DIMENSION_LABELS[v] },
    { title: '题干', dataIndex: 'content', ellipsis: true },
    { title: '正确答案', dataIndex: 'correct_answer', width: 80 },
    { title: '状态', dataIndex: 'is_active', width: 80, render: (v: number) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', width: 200, render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>编辑</Button>
          <Button size="small" onClick={() => handleToggle(r.id)}>{r.is_active ? '停用' : '启用'}</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="题目管理" extra={
        <Space>
          <Select placeholder="筛选维度" allowClear style={{ width: 160 }} value={dimFilter} onChange={v => { setDimFilter(v); setPage(1); }}>
            {Object.entries(DIMENSION_LABELS).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增题目</Button>
        </Space>
      }>
        <Table
          columns={columns} dataSource={questions} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      <Modal title={editItem ? '编辑题目' : '新增题目'} open={modalOpen} onCancel={() => { setModalOpen(false); setEditItem(null); form.resetFields(); }} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="dimension" label="维度" rules={[{ required: true }]}>
            <Select>{Object.entries(DIMENSION_LABELS).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="content" label="题干" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="option_a" label="选项A" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="option_b" label="选项B" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="option_c" label="选项C" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="option_d" label="选项D" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="correct_answer" label="正确答案" rules={[{ required: true }]}>
            <Select><Select.Option value="A">A</Select.Option><Select.Option value="B">B</Select.Option><Select.Option value="C">C</Select.Option><Select.Option value="D">D</Select.Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Questions;
