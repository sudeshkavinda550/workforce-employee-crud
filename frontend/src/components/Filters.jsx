export default function Filters({ search, setSearch, deptFilter, setDeptFilter, statusFilter, setStatusFilter, departments, setPage }) {
  return (
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
  );
}