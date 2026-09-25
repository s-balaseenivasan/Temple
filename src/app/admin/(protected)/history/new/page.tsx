import { prisma } from "@/lib/prisma";
import HistoryForm from "../history-form";

export default async function NewHistoryEntryPage() {
  const count = await prisma.historyTimelineEntry.count();
  return (
    <div>
      <h1 className="admin-title mb-6">New Timeline Entry</h1>
      <HistoryForm nextSortOrder={count} />
    </div>
  );
}
