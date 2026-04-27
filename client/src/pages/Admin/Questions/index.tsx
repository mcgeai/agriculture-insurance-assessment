import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Alert } from 'antd';
import { PlusOutlined, ImportOutlined } from '@ant-design/icons';
import { adminApi } from '../../../services';
import { DIMENSION_LABELS } from '../../../types';

const IMPORT_TEMPLATE = `# D1

**题目内容？**
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案: B
解析: 答案解析内容

---

**另一题内容？**
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案: C
解析: 答案解析内容

# D2

**D2维度的题目？**
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案: A
解析: 解析内容`;

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dimFilter, setDimFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
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

  const handleImport = async () => {
    if (!importText.trim()) {
      message.warning('请输入Markdown格式的题目内容');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await adminApi.importQuestions(importText);
      const data = res.data.data;
      setImportResult(data);
      if (data.imported > 0) {
        message.success(res.data.message);
        loadQuestions();
      }
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '维度', dataIndex: 'dimension', width: 100, render: (v: string) => DIMENSION_LABELS[v] },
    { title: '题干', dataIndex: 'content', ellipsis: true },
    { title: '正确答案', dataIndex: 'correct_answer', width: 80 },
    { title: '解析', dataIndex: 'explanation', width: 200, ellipsis: true },
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
          <Button icon={<ImportOutlined />} onClick={() => { setImportOpen(true); setImportText(''); setImportResult(null); }}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增题目</Button>
        </Space>
      }>
        <Table
          columns={columns} dataSource={questions} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      {/* 新增/编辑题目 */}
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
          <Form.Item name="explanation" label="答案解析"><Input.TextArea rows={3} placeholder="输入答案解析，帮助答题者理解" /></Form.Item>
        </Form>
      </Modal>

      {/* Markdown批量导入 */}
      <Modal
        title="Markdown批量导入题目"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        width={750}
        footer={[
          <Button key="template" onClick={() => setImportText(IMPORT_TEMPLATE)}>填充示例</Button>,
          <Button key="cancel" onClick={() => setImportOpen(false)}>取消</Button>,
          <Button key="import" type="primary" loading={importing} onClick={handleImport}>导入</Button>,
        ]}
      >
        <Alert
          message="格式说明"
          description={
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div>1. 用 <code># D1</code> ~ <code># D4</code> 标记维度，后续题目继承该维度</div>
              <div>2. 用 <code>**题干内容**</code> 标记题目（加粗），或直接写题干文字</div>
              <div>3. 选项格式：<code>A. 选项内容</code>（支持 A. / A、/ A．）</div>
              <div>4. 答案格式：<code>答案: B</code>（冒号支持中英文）</div>
              <div>5. 解析格式：<code>解析: 解析内容</code>（可选）</div>
              <div>6. 题目之间用 <code>---</code> 分隔</div>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          rows={14}
          placeholder="在此粘贴Markdown格式的题目内容..."
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        {importResult && (
          <Alert
            style={{ marginTop: 12 }}
            type={importResult.failed > 0 ? 'warning' : 'success'}
            message={'导入完成: 成功 ' + importResult.imported + ' 题' + (importResult.failed > 0 ? '，失败 ' + importResult.failed + ' 题' : '')}
            description={importResult.errors?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>{importResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
            ) : undefined}
          />
        )}
      </Modal>
    </div>
  );
};

export default Questions;
