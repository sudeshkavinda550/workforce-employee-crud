import Badge from "./Badge";

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const fmtLKR = (n) =>
  n != null ? "LKR " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2 }) : "-";

const avatarClass = (id) => `avatar avatar-${id % 8}`;

export default function EmployeeTable({ employees, loading, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <div className="table-head">
        <span>Employee</span>
        <span>Contact</span>
        <span>Department</span>
        <span>Salary (LKR)</span>
        <span>Status</span>
        <span className="col-right">Actions</span>
      </div>

      {loading ? (
        <div className="table-empty">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="table-empty">No employees found.</div>
      ) : employees.map((emp) => (
        <div className="table-row" key={emp.id}>
          <div className="emp-info">
            <div className={avatarClass(emp.id)}>{initials(emp.name)}</div>
            <div>
              <div className="emp-name">{emp.name}</div>
              <div className="emp-role">{emp.role || "-"}</div>
            </div>
          </div>
          <div>
            <div className="emp-email">{emp.email}</div>
            <div className="emp-phone">{emp.phone || "-"}</div>
          </div>
          <div className="emp-dept">{emp.department_name || "-"}</div>
          <div className="emp-salary">{fmtLKR(emp.salary)}</div>
          <div><Badge status={emp.status} /></div>
          <div className="row-actions">
            <button className="action-btn action-edit" onClick={() => onEdit(emp)}>Edit</button>
            <button className="action-btn action-delete" onClick={() => onDelete(emp)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}