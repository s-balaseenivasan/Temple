import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NewsForm from "../news-form";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit News Item</h1>
      <NewsForm existing={news} />
    </div>
  );
}
