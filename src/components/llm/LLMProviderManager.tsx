import { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Table, Popconfirm, message } from 'antd';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import type { LLMProvider } from '@/types/editor';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'moonshot', label: 'Moonshot (Kimi)' },
  { value: 'qwen', label: 'Qwen (通义)' },
  { value: 'ollama', label: 'Ollama (本地)' },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  ],
  google: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ],
  moonshot: [
    { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
    { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
    { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
  ],
  qwen: [
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-max', label: 'Qwen Max' },
  ],
  ollama: [
    { value: 'llama3', label: 'Llama 3' },
    { value: 'llama3.1', label: 'Llama 3.1' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'codellama', label: 'Code Llama' },
  ],
};

export function LLMProviderManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');

  const {
    providers,
    addProvider,
    updateProvider,
    deleteProvider,
  } = useLLMProviderStore();

  const handleAdd = () => {
    setEditingProvider(null);
    form.resetFields();
    setSelectedProvider('openai');
    setIsModalOpen(true);
  };

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider);
    form.setFieldsValue(provider);
    setSelectedProvider(provider.provider);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProvider(id);
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const providerData = {
        ...values,
        enabled: values.enabled ?? true,
        isDefault: values.isDefault ?? false,
      };

      if (editingProvider) {
        updateProvider(editingProvider.id, providerData);
        message.success('更新成功');
      } else {
        addProvider(providerData);
        message.success('添加成功');
      }

      setIsModalOpen(false);
    } catch {
      // validation failed
    }
  };

  const handleSetDefault = (id: string) => {
    providers.forEach((p) => {
      if (p.id === id) {
        updateProvider(p.id, { isDefault: true });
      } else if (p.isDefault) {
        updateProvider(p.id, { isDefault: false });
      }
    });
    message.success('已设为默认');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => {
        const option = PROVIDER_OPTIONS.find((p) => p.value === provider);
        return option?.label || provider;
      },
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (enabled ? '启用' : '禁用'),
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean, record: LLMProvider) =>
        isDefault ? (
          <span style={{ color: '#52c41a' }}>默认</span>
        ) : (
          <Button type="link" size="small" onClick={() => handleSetDefault(record.id)}>
            设为默认
          </Button>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: LLMProvider) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此 Provider？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>
          新增 Provider
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: '暂无 Provider，请点击"新增 Provider"添加' }}
      />

      <Modal
        title={editingProvider ? '编辑 Provider' : '新增 Provider'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如: 我的 OpenAI" />
          </Form.Item>

          <Form.Item
            name="provider"
            label="Provider"
            rules={[{ required: true, message: '请选择 Provider' }]}
          >
            <Select
              placeholder="选择 Provider"
              options={PROVIDER_OPTIONS}
              onChange={(value) => {
                setSelectedProvider(value);
                form.setFieldValue('model', MODEL_OPTIONS[value]?.[0]?.value);
              }}
            />
          </Form.Item>

          <Form.Item
            name="model"
            label="模型"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select
              placeholder="选择模型"
              options={MODEL_OPTIONS[selectedProvider] || []}
            />
          </Form.Item>

          <Form.Item name="apiKey" label="API Key">
            <Input.Password placeholder="输入 API Key" />
          </Form.Item>

          <Form.Item name="baseUrl" label="自定义端点 (可选)">
            <Input placeholder="如: https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item name="isDefault" label="设为默认" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
