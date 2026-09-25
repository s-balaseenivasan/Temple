// FEAT-064: shared bilingual EN/TA field-pair editor used across every
// content-CRUD form (News, Event, Gallery, Video, Committee, etc.) — English
// required, Tamil optional-but-encouraged, matching RULE-017's fallback rule.
export function BilingualField({
  label,
  nameEn,
  nameTa,
  defaultValueEn,
  defaultValueTa,
  required = true,
  multiline = false,
  error,
}: {
  label: string;
  nameEn: string;
  nameTa: string;
  defaultValueEn?: string;
  defaultValueTa?: string | null;
  required?: boolean;
  multiline?: boolean;
  error?: string[];
}) {
  const Field = multiline ? "textarea" : "input";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor={nameEn} className="admin-label">
          {label} (English){required && <span className="text-error"> *</span>}
        </label>
        <Field
          id={nameEn}
          name={nameEn}
          required={required}
          defaultValue={defaultValueEn}
          rows={multiline ? 4 : undefined}
          className="admin-input"
        />
        {error?.map((e) => (
          <p key={e} className="mt-1 text-xs text-error">
            {e}
          </p>
        ))}
      </div>
      <div>
        <label htmlFor={nameTa} className="font-tamil mb-1 block text-sm font-medium text-text-secondary">
          {label} (தமிழ் — optional)
        </label>
        <Field
          id={nameTa}
          name={nameTa}
          defaultValue={defaultValueTa ?? ""}
          rows={multiline ? 4 : undefined}
          className="font-tamil admin-input"
        />
      </div>
    </div>
  );
}
