"use client";

import dynamic from 'next/dynamic';

const PDFBuilderDemo = dynamic(
  () => import('@/pdf-builder-v2/demo/PDFBuilderDemo').then((mod) => mod.PDFBuilderDemo),
  { ssr: false }
);

export default function PDFBuilderDemoClient() {
  return <PDFBuilderDemo />;
}
