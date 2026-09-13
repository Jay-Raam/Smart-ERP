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
} from 'lucide-react';
import { useErpStore, Branch } from '../../store/erpStore';

export const BranchModule: React.FC = () => {
  const { organisation, branches, activeBranchId, setActiveBranch, addBranch } = useErpStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('33AAACT1024K1Z8');
  const [phone, setPhone] = useState('');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    addBranch({
      code,
      name,
      location,
      address,
      gstin,
      phone,
      isHeadOffice: false,
    });
    setIsAddModalOpen(false);
    setCode('');
    setName('');
    setLocation('');
    setAddress('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Organisation Legal Identity Card */}
      <div className="erp-card p-6 border-blue-100 bg-gradient-to-br from-white to-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-xl text-white shadow-sm">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{organisation.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Corporate Entity
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{organisation.address}</p>
            </div>
          </div>

          <a
            href={organisation.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition shadow-xs self-start"
          >
            <span>{organisation.website}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Identity Details Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="rounded-lg bg-slate-100/60 p-3">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Corporate CIN</span>
            <div className="font-bold text-slate-900 mt-0.5">{organisation.cin}</div>
          </div>
          <div className="rounded-lg bg-slate-100/60 p-3">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Company GSTIN</span>
            <div className="font-bold text-slate-900 mt-0.5">{organisation.gstin}</div>
          </div>
          <div className="rounded-lg bg-slate-100/60 p-3">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Permanent PAN</span>
            <div className="font-bold text-slate-900 mt-0.5">{organisation.pan}</div>
          </div>
          <div className="rounded-lg bg-slate-100/60 p-3">
            <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Corporate Boardline</span>
            <div className="font-bold text-slate-900 mt-0.5">{organisation.phone}</div>
          </div>
        </div>
      </div>

      {/* Multi-Branch Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Multi-Branch Locations ({branches.length})</h3>
            <p className="text-xs text-slate-500">
              Operational plants, manufacturing units, and distribution depots
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Branch Location</span>
          </button>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => {
            const isActive = b.id === activeBranchId;
            return (
              <div
                key={b.id}
                className={`erp-card p-5 transition-all ${
                  isActive ? 'ring-2 ring-blue-600 shadow-md bg-blue-50/20' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700">{b.code}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{b.name}</h4>
                  </div>
                  {b.isHeadOffice ? (
                    <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5">
                      Head Office
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5">
                      Unit Plant
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 pt-1">
                    GSTIN: <span className="font-semibold text-slate-800">{b.gstin}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Active Workspace</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveBranch(b.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Switch to This Branch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add Branch */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Branch Location</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-HYD-04"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad SEZ Heavy Fabrication Bay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Postal Address</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Plot 12, Hardware Park, Shamshabad, Hyderabad - 501218"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch GSTIN</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 40 2938 1120"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Register Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
