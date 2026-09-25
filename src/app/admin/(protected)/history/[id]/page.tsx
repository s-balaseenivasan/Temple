import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import HistoryForm from "../history-form";

export default async function EditHistoryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.historyTimelineEntry.findUnique({ where: { id } });
  if (!entry) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Timeline Entry</h1>
      <HistoryForm existing={entry} />
    </div>
  );
}
