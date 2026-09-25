import { prisma } from "@/lib/prisma";
import EventForm from "../event-form";

export default async function NewEventPage() {
  const categories = await prisma.eventCategory.findMany({ where: { active: true } });
  return (
    <div>
      <h1 className="admin-title mb-6">New Event</h1>
      <EventForm categories={categories} />
    </div>
  );
}
