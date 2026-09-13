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
import { Combobox } from '../shared/Combobox';
import { useIndiaStates } from '../../utils/indiaStates';

interface CustomerModuleProps {
  initialOpenAdd?: boolean;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({ initialOpenAdd = false }) => {
  const { customers, addCustomer } = useErpStore();
  const { states: stateOptions, isLoading: isStatesLoading } = useIndiaStates();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingState, setBillingState] = useState('Tamil Nadu');
  const [shippingState, setShippingState] = useState('Tamil Nadu');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [gstin, setGstin] = useState('');
  const [creditLimit, setCreditLimit] = useState(2500000);
  const [creditLimitError, setCreditLimitError] = useState('');

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

    if (!creditLimit || creditLimit <= 10000) {
      setCreditLimitError('Credit limit must be strictly more than ₹10,000 (minimum ₹10,001)');
      return;
    }

    const finalShipAddr = sameAsBilling ? billingAddress : (shippingAddress || billingAddress);
    const finalShipState = sameAsBilling ? billingState : (shippingState || billingState);

    addCustomer({
      name,
      contactPerson,
      email,
      phone,
      city,
      state: billingState || state,
      address: billingAddress,
      billingAddress,
      shippingAddress: finalShipAddr,
      billingState: billingState || state,
      shippingState: finalShipState,
      gstin,
      outstandingBalance: 0,
      creditLimit,
    });
    setIsAddModalOpen(false);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setBillingAddress('');
    setShippingAddress('');
    setGstin('');
    setCreditLimitError('');
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
          <span>{c.city}, {c.billingState || c.state}</span>
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Billing & Shipping Address',
      render: (c) => (
        <div className="max-w-xs text-xs space-y-0.5">
          <div className="text-slate-700 truncate" title={c.billingAddress || c.address}>
            <span className="font-semibold text-slate-500">Bill: </span>
            {c.billingAddress || c.address || '—'}
          </div>
          <div className="text-slate-500 truncate" title={c.shippingAddress || c.address}>
            <span className="font-semibold text-slate-400">Ship: </span>
            {c.shippingAddress || c.address || '—'}
          </div>
        </div>
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
          <div className="relative w-full max-w-lg h-[88vh] max-h-[720px] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
                <p className="text-[11px] text-slate-500">Register company account, billing state & credit limit</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setCreditLimitError(''); }} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 text-xs">
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
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">Billing State</label>
                      {isStatesLoading && (
                        <span className="text-[10px] text-blue-600 animate-pulse">Loading API...</span>
                      )}
                    </div>
                    <Combobox
                      value={billingState}
                      onChange={(val) => {
                        setBillingState(val);
                        if (sameAsBilling) setShippingState(val);
                      }}
                      options={stateOptions}
                      placeholder="Select State / UT..."
                      searchable
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Plot 14, Guindy Industrial Area, Chennai - 600032"
                    value={billingAddress}
                    onChange={(e) => {
                      setBillingAddress(e.target.value);
                      if (sameAsBilling) setShippingAddress(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800 resize-none text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="sameAsBilling"
                    checked={sameAsBilling}
                    onChange={(e) => {
                      setSameAsBilling(e.target.checked);
                      if (e.target.checked) {
                        setShippingAddress(billingAddress);
                        setShippingState(billingState);
                      }
                    }}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="sameAsBilling" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                    Shipping address same as billing address
                  </label>
                </div>

                {!sameAsBilling && (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div>
                      <Combobox
                        label="Shipping State"
                        value={shippingState}
                        onChange={(val) => setShippingState(val)}
                        options={stateOptions}
                        placeholder="Select Shipping State / UT..."
                        searchable
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Shipping Address</label>
                      <textarea
                        rows={2}
                        required={!sameAsBilling}
                        placeholder="e.g. Warehouse 3B, SIPCOT Sriperumbudur, Tamil Nadu"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-slate-800 resize-none text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Credit Limit (₹)</label>
                    <span className={`text-[11px] font-semibold ${creditLimit <= 10000 ? 'text-rose-600' : 'text-blue-600'}`}>
                      Must be &gt; ₹10,000
                    </span>
                  </div>
                  <input
                    type="number"
                    min="10001"
                    step="1"
                    required
                    placeholder="Enter amount strictly > 10000 (e.g. 50000)"
                    value={creditLimit === 0 ? '' : creditLimit}
                    onChange={(e) => {
                      const text = e.target.value;
                      const val = text === '' ? 0 : parseFloat(text);
                      setCreditLimit(val);
                      if (val <= 10000) {
                        setCreditLimitError('Credit limit must be strictly more than ₹10,000 (minimum ₹10,001)');
                      } else {
                        setCreditLimitError('');
                      }
                    }}
                    className={`w-full rounded-lg border p-2.5 outline-none font-mono text-slate-800 ${
                      creditLimit <= 10000
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 ring-1 ring-rose-200'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {creditLimit <= 10000 ? (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {creditLimitError || 'Credit limit must be strictly more than ₹10,000 (minimum ₹10,001)'}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Only amounts strictly greater than ₹10,000 are permitted.
                    </p>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex justify-end gap-2 px-6 py-3 border-t border-slate-200 shrink-0 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setCreditLimitError(''); }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditLimit <= 10000}
                  className={`rounded-lg px-4 py-2 font-semibold text-white transition shadow-xs ${
                    creditLimit <= 10000
                      ? 'bg-slate-300 cursor-not-allowed opacity-70'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
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
