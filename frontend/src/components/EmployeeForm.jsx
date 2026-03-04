import { useState } from "react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";

export default function EmployeeForm({ initial = {}, departments, onSubmit, onClose, loading }) {
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