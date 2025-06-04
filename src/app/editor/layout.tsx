import { Metadata } from 'next';
import EditorLayoutClient from './EditorLayoutClient';

export const metadata: Metadata = {
  title: 'Shape Editor - PAR Shape 2D',
  description: 'Create and edit shapes for PAR Shape 2D game',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorLayoutClient>{children}</EditorLayoutClient>;
}