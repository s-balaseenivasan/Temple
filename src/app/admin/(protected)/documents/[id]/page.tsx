import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DocumentForm from "../document-form";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Document</h1>
      <DocumentForm existing={{ ...document, publishedDate: document.publishedDate.toISOString() }} />
    </div>
  );
}
