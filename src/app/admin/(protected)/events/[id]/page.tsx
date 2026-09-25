import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EventForm from "../event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, categories] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    prisma.eventCategory.findMany({ where: { active: true } }),
  ]);
  if (!event) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Event</h1>
      <EventForm existing={{ ...event, eventDate: event.eventDate.toISOString() }} categories={categories} />
    </div>
  );
}
