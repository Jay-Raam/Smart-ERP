import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Building,
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useErpStore, Branch } from '../../store/erpStore';
import { usePermissions } from '../../hooks/usePermissions';

export const BranchModule: React.FC = () => {
  const {
    organisations,
    organisation,
    branches,
    activeBranchId,
    activeOrganisationId,
    setActiveBranch,
    switchBranch,
    switchOrganisation,
    addBranch,
    updateBranch,
    deleteBranch,
  } = useErpStore();

  const { canAdd, canEdit, canDelete } = usePermissions('branches');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [isHeadOffice, setIsHeadOffice] = useState(false);

  const orgList = organisations && organisations.length > 0 ? organisations : [organisation];
  const resolvedCurrentOrgId = activeOrganisationId || organisation.id || organisation._id || '';

  const handleOpenAdd = () => {
    setCode(`BR-${organisation.name.slice(0, 3).toUpperCase()}-0${branches.length + 1}`);
    setName('');
    setLocation('');
    setAddress(organisation.address || '');
    setGstin(organisation.gstin || '');
    setPhone(organisation.phone || '');
    setIsHeadOffice(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setCode(b.code);
    setName(b.name);
    setLocation(b.location || '');
    setAddress(b.address || '');
    setGstin(b.gstin || '');
    setPhone(b.phone || '');
    setIsHeadOffice(Boolean(b.isHeadOffice));
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBranch({
      code,
      name,
      location,
      address,
      gstin,
      phone,
      isHeadOffice,
      organisationId: resolvedCurrentOrgId,
    });
    setIsAddModalOpen(false);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    await updateBranch(editingBranch.id, {
      code,
      name,
      location,
      address,
      gstin,
      phone,
      isHeadOffice,
    });
    setEditingBranch(null);
  };

  const handleDeleteBranch = async (b: Branch) => {
    if (branches.length <= 1) {
      alert('Cannot delete the only branch in this organisation.');
      return;
    }
    if (confirm(`Are you sure you want to delete branch "${b.name}" (${b.code})?`)) {
      await deleteBranch(b.id);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Organisation Legal Identity Card */}
      <div className="erp-card p-6 border-slate-200 dark:border-[#222225] bg-white dark:bg-[#0f0f12] text-slate-900 dark:text-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 dark:border-[#222225] pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-xl text-white shadow-sm shrink-0">
              {organisation.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{organisation.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Active Corporate Entity
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{organisation.address}</p>
            </div>
          </div>

          {/* Switch Organisation Dropdown */}
          <div className="flex items-center gap-2 self-start">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-slate-50 dark:bg-[#161619] text-xs">
              <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <select
                value={resolvedCurrentOrgId}
                onChange={(e) => switchOrganisation(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer"
              >
                {orgList.map((o) => (
                  <option key={o.id || o._id} value={o.id || o._id} className="bg-white dark:bg-[#161619] text-slate-900 dark:text-slate-100">
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {organisation.website && (
              <a
                href={organisation.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#161619] px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#1f1f24] transition shadow-2xs"
              >
                <span>Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Identity Details Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="rounded-xl bg-slate-50 dark:bg-[#151518] p-3 border border-slate-100 dark:border-[#202025]">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Corporate CIN</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{organisation.cin}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[#151518] p-3 border border-slate-100 dark:border-[#202025]">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Company GSTIN</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{organisation.gstin}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[#151518] p-3 border border-slate-100 dark:border-[#202025]">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Permanent PAN</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{organisation.pan}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[#151518] p-3 border border-slate-100 dark:border-[#202025]">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Corporate Boardline</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{organisation.phone || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Multi-Branch Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Operational Branches ({branches.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manufacturing units, assembly lines, regional hubs, and distribution depots for {organisation.name}
            </p>
          </div>

          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Branch Location</span>
            </button>
          )}
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => {
            const isActive = activeBranchId === b.id;

            return (
              <div
                key={b.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                  isActive
                    ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-[#111114] ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-[#222225] bg-white dark:bg-[#0e0e11] hover:border-slate-300 dark:hover:border-[#333338] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs shadow-2xs shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-[#1f1f24] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {b.code.split('-')[1] || b.code.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {b.name}
                          </h4>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {b.code}
                          </span>
                          {b.isHeadOffice && (
                            <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              Head Office
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202025] transition cursor-pointer"
                          title="Edit Branch"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {branches.length > 1 && canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete Branch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 my-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed line-clamp-2">{b.address || b.location}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]">{b.phone}</span>
                      </div>
                    )}
                    <div className="rounded-lg bg-slate-50 dark:bg-[#161619] p-2 text-[11px] font-mono border border-slate-100 dark:border-[#202025]">
                      <span className="text-slate-400 font-sans text-[10px]">Branch GSTIN: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{b.gstin}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222225] flex items-center justify-between">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Active Operating Branch</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchBranch(b.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a1a1e] hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <span>Set as Active Branch</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-[#232328] shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#232328] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Branch Facility</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Register new operating plant under {organisation.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BR-DEL-04"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] font-mono text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location / City *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Noida Industrial Area"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Branch Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Noida High-Precision Production Plant"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Branch GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="State specific GSTIN"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] font-mono text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Facility Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 11 4180 3322"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Postal Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full plot address with pincode"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isHeadOffice"
                  checked={isHeadOffice}
                  onChange={(e) => setIsHeadOffice(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="isHeadOffice" className="font-medium cursor-pointer">
                  Designate as Corporate Head Office (HQ)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#232328]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1c20] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-[#232328] shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#232328] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Branch Facility</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{editingBranch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] font-mono text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location / City *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Branch Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Branch GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] font-mono text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Facility Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Postal Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsHeadOffice"
                  checked={isHeadOffice}
                  onChange={(e) => setIsHeadOffice(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="editIsHeadOffice" className="font-medium cursor-pointer">
                  Designate as Corporate Head Office (HQ)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#232328]">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1c20] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
