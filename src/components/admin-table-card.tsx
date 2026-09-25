export default function AdminTableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-admin-in overflow-x-auto rounded-[14px] border border-border bg-surface" style={{ animationDelay: "60ms" }}>
      {children}
    </div>
  );
}
