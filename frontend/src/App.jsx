import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const fmtLKR = (n) =>
  n != null ? "LKR " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2 }) : "-";

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "#e63946","#457b9d","#2a9d8f","#c9963a","#e07b3a","#7c3aed","#0284c7","#059669",
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function Badge({ status }) {
  const cls = {
    Active: "badge badge-active",
    Inactive: "badge badge-inactive",
    OnLeave: "badge badge-leave",
  };
  return <span className={cls[status] || "badge badge-inactive"}>{status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className="form-input" {...props} />
    </div>
  );
}

function FormSelect({ label, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-select" {...props}>{children}</select>
    </div>
  );
}

function EmployeeForm({ initial = {}, departments, onSubmit, onClose, loading }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "",
    department_id: "", salary: "", status: "Active", hire_date: "",
    ...initial,
  });
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErr("");

    if (!form.name.trim()) {
      setErr("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setErr("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (form.salary && isNaN(Number(form.salary))) {
      setErr("Salary must be a valid number.");
      return;
    }
    if (form.salary && Number(form.salary) < 0) {
      setErr("Salary cannot be negative.");
      return;
    }

    try {
      await onSubmit(form);
    } catch (e) {
      if (e.message.toLowerCase().includes("email")) {
        setErr("This email is already registered. Please use a different email.");
      } else {
        setErr(e.message);
      }
    }
  };

  return (
    <>
      <div className="form-grid">
        <FormInput label="Full Name *" value={form.name} onChange={set("name")} placeholder="Saman Perera" />
        <FormInput label="Email *" value={form.email} onChange={set("email")} placeholder="saman@company.com" type="email" />
        <FormInput label="Phone" value={form.phone} onChange={set("phone")} placeholder="+94 77 000 0000" />
        <FormInput label="Role / Title" value={form.role} onChange={set("role")} placeholder="Senior Engineer" />
        <FormSelect label="Department" value={form.department_id} onChange={set("department_id")}>
          <option value="">Select Department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </FormSelect>
        <FormSelect label="Status" value={form.status} onChange={set("status")}>
          <option>Active</option>
          <option>Inactive</option>
          <option>OnLeave</option>
        </FormSelect>
        <FormInput label="Salary (LKR)" value={form.salary} onChange={set("salary")} placeholder="75000.00" type="number" />
        <FormInput label="Hire Date" value={form.hire_date} onChange={set("hire_date")} type="date" />
      </div>
      {err && <div className="form-error">{err}</div>}
      <div className="form-actions">
        <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Employee"}
        </button>
      </div>
    </>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAllEmployees = async () => {
    try {
      const data = await apiFetch("/employees?page=1&per_page=10000");
      setAllEmployees(data.employees);
    } catch {}
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, per_page: 8, search, department: deptFilter, status: statusFilter,
      });
      const data = await apiFetch(`/employees?${params}`);
      setEmployees(data.employees);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, statusFilter]);

  const fetchStats = async () => {
    try { setStats(await apiFetch("/stats")); } catch {}
  };

  const fetchDepts = async () => {
    try { setDepts(await apiFetch("/departments")); } catch {}
  };

  useEffect(() => { fetchDepts(); fetchStats(); fetchAllEmployees(); }, []);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchEmployees(); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const duplicateName = allEmployees.find(
        (emp) => emp.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (duplicateName) {
        throw new Error("An employee with this name already exists.");
      }
      const duplicateEmail = allEmployees.find(
        (emp) => emp.email.trim().toLowerCase() === form.email.trim().toLowerCase()
      );
      if (duplicateEmail) {
        throw new Error("This email is already registered. Please use a different email.");
      }
      await apiFetch("/employees", { method: "POST", body: JSON.stringify(form) });
      setModal(null);
      fetchEmployees();
      fetchStats();
      fetchAllEmployees();
      showToast("Employee created successfully.");
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      const duplicateName = allEmployees.find(
        (emp) =>
          emp.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
          emp.id !== modal.id
      );
      if (duplicateName) {
        throw new Error("Another employee with this name already exists.");
      }
      const duplicateEmail = allEmployees.find(
        (emp) =>
          emp.email.trim().toLowerCase() === form.email.trim().toLowerCase() &&
          emp.id !== modal.id
      );
      if (duplicateEmail) {
        throw new Error("This email is already registered. Please use a different email.");
      }
      await apiFetch(`/employees/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
      setModal(null);
      fetchEmployees();
      fetchStats();
      fetchAllEmployees();
      showToast("Employee updated successfully.");
    } catch (e) {
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/employees/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchEmployees();
      fetchStats();
      fetchAllEmployees();
      showToast("Employee deleted.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <>
      <div className="app">

        {toast && (
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        )}

        <header className="header">
          <div className="header-brand">
            <div className="brand-name">WorkForce</div>
            <div className="brand-sub">Employee Management System</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            + Add Employee
          </button>
        </header>

        <main className="main">

          {stats && (
            <div className="stats-row">
              <StatCard label="Total Employees" value={stats.total} accent="#1d4ed8" />
              <StatCard label="Active" value={stats.active} accent="#15803d" />
              <StatCard label="Inactive / Leave" value={stats.inactive} accent="#b45309" />
              <StatCard label="Avg. Salary" value={fmtLKR(stats.avg_salary)} accent="#7c3aed" />
            </div>
          )}

          <div className="filters-row">
            <input
              className="search-input"
              placeholder="Search name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id}>{d.name}</option>)}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>OnLeave</option>
            </select>
          </div>

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
                  <div className="avatar" style={{ background: avatarColor(emp.id) }}>
                    {initials(emp.name)}
                  </div>
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
                  <button className="action-btn action-edit" onClick={() => setModal(emp)}>Edit</button>
                  <button className="action-btn action-delete" onClick={() => setDeleteTarget(emp)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "page-btn-active" : ""}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              ))}
            </div>
          )}

          <div className="table-footer">
            Showing {employees.length} of {total} employees
          </div>
        </main>
      </div>

      {modal === "create" && (
        <Modal title="New Employee" onClose={() => setModal(null)}>
          <EmployeeForm
            departments={departments}
            onSubmit={handleCreate}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {modal && modal !== "create" && (
        <Modal title="Edit Employee" onClose={() => setModal(null)}>
          <EmployeeForm
            initial={{
              ...modal,
              department_id: modal.department_id || "",
              hire_date: modal.hire_date
              ? new Date(modal.hire_date).toISOString().split("T")[0]
              : "",
            }}
            departments={departments}
            onSubmit={handleUpdate}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="delete-msg">
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}