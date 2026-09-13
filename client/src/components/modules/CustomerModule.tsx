import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  X,
} from 'lucide-react';
import { useErpStore, Customer } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';

interface CustomerModuleProps {
  initialOpenAdd?: boolean;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({ initialOpenAdd = false }) => {
  const { customers, addCustomer } = useErpStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [gstin, setGstin] = useState('');
  const [creditLimit, setCreditLimit] = useState(2500000);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name,
      contactPerson,
      email,
      phone,
      city,
      state,
      gstin,
      outstandingBalance: 0,
      creditLimit,
    });
    setIsAddModalOpen(false);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setGstin('');
  };

  const columns: ColumnDef<Customer>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (c) => <span className="font-mono font-bold text-blue-700">{c.code}</span>,
    },
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (c) => <span className="font-bold text-slate-900">{c.name}</span>,
    },
    {
      key: 'contactPerson',
      header: 'Key Contact Person',
      sortable: true,
      render: (c) => <span className="text-slate-600">{c.contactPerson}</span>,
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (c) => (
        <div>
          <div className="text-slate-700">{c.email}</div>
          <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      sortable: true,
      render: (c) => (
        <span className="text-slate-600 flex items-center gap-1">
          <MapPin className="h-3 w-3 text-slate-400" />
          <span>{c.city}, {c.state}</span>
        </span>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      sortable: true,
      render: (c) => <span className="font-mono text-slate-500">{c.gstin}</span>,
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
      sortable: true,
      align: 'right',
      render: (c) => (
        <span className="font-mono font-bold text-amber-600">
          ₹{c.outstandingBalance.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      sortable: true,
      align: 'right',
      render: (c) => (
        <span className="font-mono text-slate-500">
          ₹{c.creditLimit.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Directory Master</h2>
          <p className="text-xs text-slate-500">
            Enterprise client accounts, GSTIN verification, credit terms, and receivables
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Modern Smart ERP DataTable */}
      <DataTable
        data={customers}
        columns={columns}
        searchPlaceholder="Search company, contact person, city, or GSTIN..."
        searchKeys={['name', 'contactPerson', 'city', 'gstin', 'code']}
        pageSizeDefault={10}
      />

      {/* Modal: Add Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bharat Electronics Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. Ramanathan"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    required
                    placeholder="33AAACB1234P1Z1"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="procurement@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98400 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="50000"
                  required
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                />
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
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
