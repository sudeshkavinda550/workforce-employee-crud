import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { apiFetch } from "./api/apiFetch";
import StatCard from "./components/StatCard";
import Modal from "./components/Modal";
import EmployeeForm from "./components/EmployeeForm";
import EmployeeTable from "./components/EmployeeTable";
import Filters from "./components/Filters";

const fmtLKR = (n) =>
  n != null ? "LKR " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2 }) : "-";

export default function App() {
  const [employees, setEmployees]       = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [stats, setStats]               = useState(null);
  const [departments, setDepts]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [search, setSearch]             = useState("");
  const [deptFilter, setDeptFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]               = useState(null);

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

  const refreshAll = () => {
    fetchEmployees();
    fetchStats();
    fetchAllEmployees();
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
      if (duplicateName) throw new Error("An employee with this name already exists.");

      const duplicateEmail = allEmployees.find(
        (emp) => emp.email.trim().toLowerCase() === form.email.trim().toLowerCase()
      );
      if (duplicateEmail) throw new Error("This email is already registered. Please use a different email.");

      await apiFetch("/employees", { method: "POST", body: JSON.stringify(form) });
      setModal(null);
      refreshAll();
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
        (emp) => emp.name.trim().toLowerCase() === form.name.trim().toLowerCase() && emp.id !== modal.id
      );
      if (duplicateName) throw new Error("Another employee with this name already exists.");

      const duplicateEmail = allEmployees.find(
        (emp) => emp.email.trim().toLowerCase() === form.email.trim().toLowerCase() && emp.id !== modal.id
      );
      if (duplicateEmail) throw new Error("This email is already registered. Please use a different email.");

      await apiFetch(`/employees/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
      setModal(null);
      refreshAll();
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
      refreshAll();
      showToast("Employee deleted.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
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

        <Filters
          search={search} setSearch={setSearch}
          deptFilter={deptFilter} setDeptFilter={setDeptFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          departments={departments} setPage={setPage}
        />

        <EmployeeTable
          employees={employees}
          loading={loading}
          onEdit={(emp) => setModal(emp)}
          onDelete={(emp) => setDeleteTarget(emp)}
        />

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
    </div>
  );
}