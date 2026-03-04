export default function Badge({ status }) {
  const cls = {
    Active:   "badge badge-active",
    Inactive: "badge badge-inactive",
    OnLeave:  "badge badge-leave",
  };
  return <span className={cls[status] || "badge badge-inactive"}>{status}</span>;
}