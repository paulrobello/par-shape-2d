import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shape Editor - PAR Shape 2D',
  description: 'Create and edit shapes for PAR Shape 2D game',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="editor-layout">
      {children}
    </div>
  );
}