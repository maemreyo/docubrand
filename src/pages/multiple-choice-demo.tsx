import React from 'react';
import MultipleChoiceBlockDemo from '@/components/MultipleChoiceBlockDemo';

/**
 * Multiple Choice Demo Page
 * 
 * This page demonstrates how to use the multiple choice block composers
 * to create and manage multiple choice questions in a template.
 */
const MultipleChoiceDemoPage: React.FC = () => {
  return (
    <div className="container">
      <MultipleChoiceBlockDemo />
    </div>
  );
};

export default MultipleChoiceDemoPage;