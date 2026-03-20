import { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Table, Popconfirm, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import type { LLMProvider } from '@/types/editor';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

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
  const { t } = useTranslation();
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
    message.success(t('common.delete') + ' ' + t('llm.provider'));
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
        message.success(t('common.edit') + ' ' + t('llm.provider'));
      } else {
        addProvider(providerData);
        message.success(t('common.add') + ' ' + t('llm.provider'));
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
    message.success(t('llm.setAsDefault'));
  };

  const columns = [
    {
      title: t('llm.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('llm.provider'),
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => {
        const option = PROVIDER_OPTIONS.find((p) => p.value === provider);
        return option?.label || provider;
      },
    },
    {
      title: t('llm.model'),
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: t('llm.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <span
          style={{
            color: enabled ? 'var(--color-success)' : 'var(--color-text-secondary)',
            fontSize: 13,
          }}
        >
          {enabled ? t('llm.enabled') : t('llm.disabled')}
        </span>
      ),
    },
    {
      title: t('llm.default'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean, record: LLMProvider) =>
        isDefault ? (
          <span style={{ color: 'var(--color-success)', fontSize: 13 }}>
            {t('llm.default')}
          </span>
        ) : (
          <Button
            type="link"
            size="small"
            onClick={() => handleSetDefault(record.id)}
            style={{ padding: 0, fontSize: 13 }}
          >
            {t('llm.setAsDefault')}
          </Button>
        ),
    },
    {
      title: t('common.edit'),
      key: 'action',
      render: (_: unknown, record: LLMProvider) => (
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={t('llm.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Button
          type="primary"
          onClick={handleAdd}
          icon={<PlusOutlined />}
        >
          {t('llm.addProvider')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: t('llm.noProviders') }}
        style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      />

      <Modal
        title={editingProvider ? t('llm.editProvider') : t('llm.addProvider')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('llm.name')}
            rules={[{ required: true, message: `Please enter ${t('llm.name').toLowerCase()}` }]}
          >
            <Input placeholder="e.g., My OpenAI" />
          </Form.Item>

          <Form.Item
            name="provider"
            label={t('llm.provider')}
            rules={[{ required: true, message: `Please select a ${t('llm.provider').toLowerCase()}` }]}
          >
            <Select
              placeholder={`Select ${t('llm.provider').toLowerCase()}`}
              options={PROVIDER_OPTIONS}
              onChange={(value) => {
                setSelectedProvider(value);
                form.setFieldValue('model', MODEL_OPTIONS[value]?.[0]?.value);
              }}
            />
          </Form.Item>

          <Form.Item
            name="model"
            label={t('llm.model')}
            rules={[{ required: true, message: `Please select a ${t('llm.model').toLowerCase()}` }]}
          >
            <Select
              placeholder={`Select ${t('llm.model').toLowerCase()}`}
              options={MODEL_OPTIONS[selectedProvider] || []}
            />
          </Form.Item>

          <Form.Item name="apiKey" label={t('llm.apiKey')}>
            <Input.Password placeholder={`Enter ${t('llm.apiKey').toLowerCase()}`} />
          </Form.Item>

          <Form.Item name="baseUrl" label={t('llm.customEndpoint')}>
            <Input placeholder="e.g., https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item name="enabled" label={t('llm.enabled')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item name="isDefault" label={t('llm.setAsDefault')} valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
