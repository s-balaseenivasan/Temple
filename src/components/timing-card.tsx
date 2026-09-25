// One session in the timings "almanac": label, then the hours set large in
// the display serif. No box — the widget draws the dividing rule between
// sessions.
export default function TimingCard({
  icon,
  label,
  time,
  langClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  langClass?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-6 sm:px-8 sm:py-2 sm:first:pl-0">
      <p className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-secondary ${langClass}`}>
        <span aria-hidden="true" className="text-secondary">
          {icon}
        </span>
        {label}
      </p>
      <p className="whitespace-nowrap font-display text-3xl font-semibold tabular-nums text-text-primary">{time}</p>
    </div>
  );
}
