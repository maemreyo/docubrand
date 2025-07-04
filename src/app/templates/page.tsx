'use client';

import { TemplateManager } from '@/components/TemplateManager';

export default function TemplatesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Template Library</h1>
      <TemplateManager />
    </div>
  );
}
