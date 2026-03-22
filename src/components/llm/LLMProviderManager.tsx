import { useState } from 'react';
import { Modal, Form, Input, Select, Switch, Button, Table, Popconfirm, message, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLLMProviderStore } from '@/store/llmProviderStore';
import {
  type LLMProvider,
  type ProviderType,
  PROVIDER_CONFIGS,
  getProviderConfig,
  getModelsByProvider,
} from '@/types/editor';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export function LLMProviderManager() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai');
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customModelInput, setCustomModelInput] = useState('');

  const {
    providers,
    addProvider,
    updateProvider,
    deleteProvider,
    setImageProcessor,
  } = useLLMProviderStore();

  const providerOptions = PROVIDER_CONFIGS.map((p) => ({
    value: p.value,
    label: p.label,
  }));

  const currentModels = getModelsByProvider(selectedProvider);
  const currentConfig = getProviderConfig(selectedProvider);
  const showCustomModelInput = selectedProvider === 'custom' || currentModels.length === 0;

  const handleAdd = () => {
    setEditingProvider(null);
    form.resetFields();
    setSelectedProvider('openai');
    setCustomModels([]);
    setCustomModelInput('');
    form.setFieldsValue({
      enabled: true,
      isDefault: false,
      isImageProcessor: false,
    });
    const defaultConfig = getProviderConfig('openai');
    if (defaultConfig?.defaultBaseUrl) {
      form.setFieldValue('baseUrl', defaultConfig.defaultBaseUrl);
    }
    setIsModalOpen(true);
  };

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider);
    setSelectedProvider(provider.provider);
    const config = getProviderConfig(provider.provider);
    if (provider.provider === 'custom' || !config?.models.length) {
      const savedCustomModels = provider.model.split(',').map((m) => m.trim()).filter(Boolean);
      setCustomModels(savedCustomModels);
    } else {
      setCustomModels([]);
    }
    form.setFieldsValue(provider);
    if (config?.defaultBaseUrl && !provider.baseUrl) {
      form.setFieldValue('baseUrl', config.defaultBaseUrl);
    } else {
      form.setFieldValue('baseUrl', provider.baseUrl);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProvider(id);
    message.success(t('common.delete') + ' ' + t('llm.provider'));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let model = values.model;

      if (selectedProvider === 'custom') {
        const allModels = [...customModels];
        if (values.customModel?.trim()) {
          allModels.push(values.customModel.trim());
        }
        model = allModels.join(',');
      }

      const providerData = {
        ...values,
        model,
        enabled: values.enabled ?? true,
        isDefault: values.isDefault ?? false,
        isImageProcessor: values.isImageProcessor ?? false,
      };

      if (editingProvider) {
        await updateProvider(editingProvider.id, providerData);
        if (providerData.isImageProcessor) {
          await setImageProcessor(editingProvider.id);
        }
        message.success(t('common.edit') + ' ' + t('llm.provider'));
      } else {
        const newProvider = await addProvider(providerData);
        if (providerData.isImageProcessor) {
          await setImageProcessor(newProvider.id);
        }
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

  const handleSetImageProcessor = async (id: string) => {
    await setImageProcessor(id);
    message.success(t('llm.setAsImageProcessor'));
  };

  const handleProviderChange = (value: ProviderType) => {
    setSelectedProvider(value);
    setCustomModels([]);
    form.setFieldValue('model', undefined);
    const config = getProviderConfig(value);
    if (config?.defaultBaseUrl) {
      form.setFieldValue('baseUrl', config.defaultBaseUrl);
    }
  };

  const handleAddCustomModel = () => {
    if (customModelInput.trim() && !customModels.includes(customModelInput.trim())) {
      setCustomModels([...customModels, customModelInput.trim()]);
      setCustomModelInput('');
    }
  };

  const handleRemoveCustomModel = (model: string) => {
    setCustomModels(customModels.filter((m) => m !== model));
  };

  const getProviderLabel = (providerType: ProviderType) => {
    const config = getProviderConfig(providerType);
    return config?.label ?? providerType;
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
      render: (provider: ProviderType) => (
        <Tag color="blue">{getProviderLabel(provider)}</Tag>
      ),
    },
    {
      title: t('llm.model'),
      dataIndex: 'model',
      key: 'model',
      render: (model: string, record: LLMProvider) => {
        const config = getProviderConfig(record.provider);
        const modelList = model.split(',').map((m) => m.trim()).filter(Boolean);
        const labels = modelList.map((m) => {
          const found = config?.models.find((cm) => cm.value === m);
          return found?.label ?? m;
        });
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {labels.map((label, i) => (
              <Tag key={i} style={{ margin: 0 }}>{label}</Tag>
            ))}
          </div>
        );
      },
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
      title: t('llm.imageProcessor'),
      dataIndex: 'isImageProcessor',
      key: 'isImageProcessor',
      render: (isImageProcessor: boolean, record: LLMProvider) =>
        isImageProcessor ? (
          <span style={{ color: 'var(--color-primary)', fontSize: 13 }}>
            {t('llm.imageProcessorActive')}
          </span>
        ) : (
          <Button
            type="link"
            size="small"
            onClick={() => handleSetImageProcessor(record.id)}
            style={{ padding: 0, fontSize: 13 }}
          >
            {t('llm.setAsImageProcessor')}
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
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: t('llm.noProviders') }}
        style={{
          borderRadius: 'var(--radius-md)',
        }}
      />

      <Modal
        title={editingProvider ? t('llm.editProvider') : t('llm.addProvider')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        width={520}
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
              options={providerOptions}
              value={selectedProvider}
              onChange={handleProviderChange}
            />
          </Form.Item>

          {showCustomModelInput ? (
            <>
              <Form.Item label={t('llm.model')}>
                <div style={{ marginBottom: 8 }}>
                  {customModels.map((model) => (
                    <Tag
                      key={model}
                      closable
                      onClose={() => handleRemoveCustomModel(model)}
                      style={{ marginBottom: 4 }}
                    >
                      {model}
                    </Tag>
                  ))}
                </div>
                <Input
                  placeholder="Enter model name and press Add"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  onPressEnter={handleAddCustomModel}
                  addonAfter={
                    <Button type="link" size="small" onClick={handleAddCustomModel} style={{ padding: 0 }}>
                      Add
                    </Button>
                  }
                />
              </Form.Item>
              <Form.Item
                name="model"
                hidden
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="customModel"
                hidden
              >
                <Input />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="model"
              label={t('llm.model')}
              rules={[{ required: true, message: `Please select a ${t('llm.model').toLowerCase()}` }]}
            >
              <Select
                placeholder={`Select ${t('llm.model').toLowerCase()}`}
                options={currentModels.map((m) => ({ value: m.value, label: m.label }))}
              />
            </Form.Item>
          )}

          <Form.Item name="apiKey" label={t('llm.apiKey')}>
            <Input.Password placeholder={`Enter ${t('llm.apiKey').toLowerCase()}`} />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label={t('llm.customEndpoint')}
            extra={currentConfig?.defaultBaseUrl ? `Default: ${currentConfig.defaultBaseUrl}` : undefined}
          >
            <Input placeholder={currentConfig?.supportsCustomBaseUrl ? 'https://api.example.com/v1' : 'Not configurable'} />
          </Form.Item>

          <Form.Item name="enabled" label={t('llm.enabled')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Form.Item name="isDefault" label={t('llm.setAsDefault')} valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>

          <Form.Item name="isImageProcessor" label={t('llm.setAsImageProcessor')} valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>

          <Form.Item
            name="maxContextWindow"
            label={t('llm.maxContextWindow')}
          >
            <Input type="number" placeholder="e.g., 128000" />
          </Form.Item>

          <Form.Item
            name="maxTokens"
            label={t('llm.maxTokens')}
          >
            <Input type="number" placeholder="e.g., 4096" />
          </Form.Item>

          <Form.Item
            name="temperature"
            label={t('llm.temperature')}
          >
            <Input type="number" placeholder="e.g., 0.7" step="0.1" />
          </Form.Item>

          <Form.Item
            name="topP"
            label={t('llm.topP')}
          >
            <Input type="number" placeholder="e.g., 0.9" step="0.1" />
          </Form.Item>

          <Form.Item
            name="reasoningLevel"
            label={t('llm.reasoningLevel')}
          >
            <Select
              placeholder={t('llm.reasoningLevelPlaceholder')}
              options={[
                { value: '', label: t('llm.notUseReasoning') },
                { value: 'low', label: t('llm.reasoningLow') },
                { value: 'medium', label: t('llm.reasoningMedium') },
                { value: 'high', label: t('llm.reasoningHigh') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
