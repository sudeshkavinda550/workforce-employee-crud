export default function FormSelect({ label, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" {...props}>{children}</select>
    </div>
  );
}