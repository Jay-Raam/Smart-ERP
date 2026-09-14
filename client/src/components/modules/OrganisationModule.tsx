import React, { useState } from 'react';
import {
  Layers,
  Building2,
  Plus,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  X,
  Loader2,
} from 'lucide-react';
import { useErpStore, OrganisationInfo } from '../../store/erpStore';
import { usePermissions } from '../../hooks/usePermissions';

interface OrganisationModuleProps {
  onNavigateToBranches?: (orgId: string) => void;
}

export const OrganisationModule: React.FC<OrganisationModuleProps> = ({ onNavigateToBranches }) => {
  const {
    organisations,
    organisation,
    activeOrganisationId,
    switchOrganisation,
    addOrganisation,
    updateOrganisation,
    deleteOrganisation,
  } = useErpStore();

  const { canAdd, canEdit, canDelete } = usePermissions('organisations');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganisationInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [defaultBranchCode, setDefaultBranchCode] = useState('');
  const [location, setLocation] = useState('');

  const orgList = organisations && organisations.length > 0 ? organisations : [organisation];
  const resolvedCurrentOrgId = activeOrganisationId || organisation.id || organisation._id || '';

  const handleOpenAdd = () => {
    setName('');
    setCin('');
    setGstin('');
    setPan('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setAddress('');
    setDefaultBranchCode('');
    setLocation('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (org: OrganisationInfo) => {
    setEditingOrg(org);
    setName(org.name);
    setCin(org.cin);
    setGstin(org.gstin);
    setPan(org.pan || '');
    setEmail(org.email || '');
    setPhone(org.phone || '');
    setWebsite(org.website || '');
    setAddress(org.address || '');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cin.trim() || !gstin.trim()) return;

    setIsSubmitting(true);
    try {
      await addOrganisation({
        name: name.trim(),
        cin: cin.trim(),
        gstin: gstin.trim(),
        pan: pan.trim() || (cin.trim().length >= 12 ? cin.trim().slice(2, 12) : 'AAACT1024K'),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        address: address.trim(),
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    const orgId = editingOrg.id || editingOrg._id;
    if (!orgId) return;

    setIsSubmitting(true);
    try {
      await updateOrganisation(orgId, {
        name: name.trim(),
        cin: cin.trim(),
        gstin: gstin.trim(),
        pan: pan.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        address: address.trim(),
      });
      setEditingOrg(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (orgId: string, orgName: string) => {
    if (orgList.length <= 1) {
      alert('Cannot delete the only remaining active organisation.');
      return;
    }
    if (confirm(`Are you sure you want to remove "${orgName}" and all associated branches?`)) {
      await deleteOrganisation(orgId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#222225] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Multi-Organisation Master
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {orgList.length} Registered Entities
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage parent corporations, legal subsidiaries, tax identities, and physical branches
              </p>
            </div>
          </div>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-[0.99] transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Organisation</span>
          </button>
        )}
      </div>

      {/* Organisation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orgList.map((orgItem) => {
          const orgId = orgItem.id || orgItem._id || '';
          const isActive = resolvedCurrentOrgId === orgId;

          return (
            <div
              key={orgId}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500/80 bg-white dark:bg-[#111114] ring-2 ring-blue-500/15 shadow-sm'
                  : 'border-slate-200 dark:border-[#222225] bg-white dark:bg-[#0e0e11] hover:border-slate-300 dark:hover:border-[#333338] shadow-2xs'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold text-lg shadow-2xs ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-[#1f1f24] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {orgItem.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {orgItem.name}
                      </h3>
                      {isActive && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active Workspace</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(orgItem)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202025] transition cursor-pointer"
                        title="Edit Organisation"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {orgList.length > 1 && canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(orgId, orgItem.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Organisation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Identity Identifiers (CIN, GSTIN, PAN) */}
                <div className="rounded-xl bg-slate-50 dark:bg-[#151518] p-3 space-y-1.5 text-xs font-mono my-3 border border-slate-100 dark:border-[#222226]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">CIN</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{orgItem.cin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">GSTIN</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{orgItem.gstin}</span>
                  </div>
                  {orgItem.pan && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">PAN</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{orgItem.pan}</span>
                    </div>
                  )}
                </div>

                {/* Contact & Location Info */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2 mb-4">
                  {orgItem.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed line-clamp-2">{orgItem.address}</span>
                    </div>
                  )}
                  {orgItem.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px]">{orgItem.phone}</span>
                    </div>
                  )}
                  {orgItem.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] truncate">{orgItem.email}</span>
                    </div>
                  )}
                  {orgItem.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a
                        href={orgItem.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{orgItem.website.replace('https://', '')}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#222225] flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{orgItem.branchCount !== undefined ? orgItem.branchCount : 3} Branches</span>
                </span>

                {isActive ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1c20] text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-default"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Current Active</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchOrganisation(orgId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Switch Workspace</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Organisation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-[#232328] shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#232328] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Enterprise Organisation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Register new corporate parent or subsidiary entity</p>
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

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smart Logistics & Supply Chain Pvt. Ltd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Corporate CIN *</label>
                  <input
                    type="text"
                    required
                    value={cin}
                    onChange={(e) => setCin(e.target.value.toUpperCase())}
                    placeholder="e.g. U29100TN2026PLC089211"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Company GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 33AAACT1024K1Z8"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="e.g. AAACT1024K"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Boardline Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 44 2839 4910"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operations@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Company Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot/Street, Industrial Area, City, State, PIN"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
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
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save & Initialize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organisation Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#101014] border border-slate-200 dark:border-[#232328] shadow-2xl p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#232328] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Edit Organisation Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update corporate identity & statutory details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company Legal Name *</label>
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
                  <label className="block font-semibold mb-1">Corporate CIN *</label>
                  <input
                    type="text"
                    required
                    value={cin}
                    onChange={(e) => setCin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Company GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs font-mono focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Boardline Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Company Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2b2b31] bg-white dark:bg-[#16161a] text-xs focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#232328]">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c1c20] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
