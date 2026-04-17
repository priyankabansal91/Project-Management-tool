import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, AlertCircle } from 'lucide-react';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  multiple?: boolean;
  order: number;
  condition?: {
    field: string;
    operator: 'equals' | 'greaterThan' | 'lessThan';
    value: any;
  };
}

interface FormBuilderProps {
  title: string;
  description: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
}

export function FormBuilder({ title, description, fields, onSubmit, loading = false }: FormBuilderProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter visible fields based on conditions
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.condition) return true;

      const conditionValue = formData[field.condition.field];
      if (conditionValue === undefined) return false;

      switch (field.condition.operator) {
        case 'equals':
          return conditionValue === field.condition.value;
        case 'greaterThan':
          return Number(conditionValue) > field.condition.value;
        case 'lessThan':
          return Number(conditionValue) < field.condition.value;
        default:
          return true;
      }
    });
  }, [fields, formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    visibleFields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.name} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md resize-none ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {field.name}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">{field.name}</span>
          </label>
        );

      case 'file':
        return (
          <Input
            type="file"
            multiple={field.multiple}
            onChange={(e) => handleChange(field.id, e.target.files)}
            className={error ? 'border-red-500' : ''}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleFields.map((field) => {
            const error = errors[field.id];

            return (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {renderField(field)}

                {error && (
                  <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
