import type { Metadata } from 'next';
import './globals.css';
import {provenance} from '@/shared/provenance.mjs';
export const metadata: Metadata = {
  authors: [{name:'94'}],
  other: {'project-origin':provenance.originId},
  title: '玖肆智慧医院 · SmartGuide',
  description: '医院电子导诊、院内导航与完整就诊流程互动演示',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body data-project-origin={provenance.originId}>{children}</body>
    </html>
  );
}
