import { useState } from 'react';
import { useFormTemplates, useSubmitForm } from '@/api/hooks';
import { FormBuilder } from '@/components/shared/FormBuilder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader, ChevronRight } from 'lucide-react';

export function FormsPage() {
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const { data: templates, isLoading } = useFormTemplates();
  const submitForm = useSubmitForm();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const forms = templates || [];
  const currentForm = forms.find((f: any) => f.id === selectedForm);

  if (selectedForm && currentForm) {
    return (
      <div className="space-y-6 p-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedForm(null)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back to Forms
        </button>

        {/* Form Builder */}
        <FormBuilder
          title={currentForm.name}
          description={currentForm.description}
          fields={currentForm.fields}
          onSubmit={(data) => {
            submitForm.mutate({ formId: selectedForm, ...data });
          }}
          loading={submitForm.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Forms & Intake</h1>
        <p className="text-muted-foreground">Submit forms to create tasks and initiate workflows</p>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form: any) => (
          <Card
            key={form.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedForm(form.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{form.name}</h3>
                <p className="text-sm text-muted-foreground">{form.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
            </div>

            {/* Form Type Badge */}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant={form.type === 'public' ? 'default' : 'secondary'}>
                {form.type === 'public' ? 'Public' : 'Internal'}
              </Badge>
              <span className="text-xs text-muted-foreground">{form.fields.length} fields</span>
            </div>

            {/* Fields Preview */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Fields:</p>
              <div className="space-y-1">
                {form.fields.slice(0, 3).map((field: any) => (
                  <div key={field.id} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                    {field.name}
                    {field.required && <span className="text-red-500">*</span>}
                  </div>
                ))}
                {form.fields.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{form.fields.length - 3} more</div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button className="w-full mt-4" onClick={() => setSelectedForm(form.id)}>
              Fill Form
            </Button>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {forms.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No forms available</p>
          <p className="text-sm text-muted-foreground mt-2">Contact your administrator to create forms</p>
        </Card>
      )}
    </div>
  );
}
