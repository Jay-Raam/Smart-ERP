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
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useErpStore, Customer } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';
import { useIndiaStates } from '../../utils/indiaStates';
import { CustomerDetailsDrawer } from './customers/CustomerDetailsDrawer';
import { ExportModal, ExportColumn } from '../shared/ExportModal';
import {
  useFormValidation,
  isValidGSTIN,
  isValidCreditLimit,
  EMAIL_REGEX,
  PHONE_REGEX,
} from '../../utils/validation';

interface CustomerFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  billingState: string;
  billingAddress: string;
  shippingState: string;
  shippingAddress: string;
  sameAsBilling: boolean;
  gstin: string;
  creditLimit: number | string;
}

interface CustomerModuleProps {
  initialOpenAdd?: boolean;
  onNavigateToInvoiceCreate?: (customerId: string) => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  initialOpenAdd = false,
  onNavigateToInvoiceCreate,
}) => {
  const { customers, addCustomer } = useErpStore();
  const { states: stateOptions, isLoading: isStatesLoading } = useIndiaStates();
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportColumns: ExportColumn<Customer>[] = [
    { key: 'code', label: 'Customer Code' },
    { key: 'name', label: 'Company / Customer Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phone', label: 'Mobile Phone' },
    { key: 'email', label: 'Email Address' },
    { key: 'city', label: 'City' },
    { key: 'billingState', label: 'Billing State' },
    { key: 'gstin', label: 'GSTIN' },
    {
      key: 'creditLimit',
      label: 'Credit Limit',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding Balance',
      transform: (v) => (v ? `₹${Number(v).toLocaleString('en-IN')}` : '₹0'),
    },
  ];

  // 3-Tier Form Validation Setup
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
  } = useFormValidation<CustomerFormData>({
    initialValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: 'Chennai',
      billingState: 'Tamil Nadu',
      billingAddress: '',
      shippingState: 'Tamil Nadu',
      shippingAddress: '',
      sameAsBilling: true,
      gstin: '',
      creditLimit: 2500000,
    },
    validationSchema: {
      name: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length >= 2),
          message: 'Company name must be at least 2 characters.',
        },
      ],
      contactPerson: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length >= 2),
          message: 'Contact person name is required.',
        },
      ],
      email: [
        {
          validate: (val: any) => Boolean(val && EMAIL_REGEX.test(String(val).trim())),
          message: 'Valid business email is required.',
        },
      ],
      phone: [
        {
          validate: (val: any) => Boolean(val && PHONE_REGEX.test(String(val).trim())),
          message: 'Valid 10-digit Indian phone number required.',
        },
      ],
      city: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'City is required.',
        },
      ],
      billingState: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length > 0),
          message: 'Billing State is required.',
        },
      ],
      billingAddress: [
        {
          validate: (val: any) => Boolean(val && String(val).trim().length >= 5),
          message: 'Complete billing address is required (min 5 characters).',
        },
      ],
      creditLimit: [
        {
          validate: (val: any) => isValidCreditLimit(val),
          message: 'Credit limit must be strictly more than ₹10,000 (minimum ₹10,001).',
        },
      ],
      gstin: [
        {
          validate: (val: any, all?: CustomerFormData) => {
            if (!val || !String(val).trim()) return true; // Optional field
            const res = isValidGSTIN(String(val).trim(), all?.billingState);
            return res.valid || res.error || 'Invalid GSTIN';
          },
          message: 'Invalid GSTIN format or State Code mismatch.',
        },
      ],
    },
  });

  const onSubmitAddCustomer = async (formVals: CustomerFormData) => {
    const finalShipAddr = formVals.sameAsBilling
      ? formVals.billingAddress
      : formVals.shippingAddress || formVals.billingAddress;
    const finalShipState = formVals.sameAsBilling
      ? formVals.billingState
      : formVals.shippingState || formVals.billingState;

    await addCustomer({
      name: formVals.name.trim(),
      contactPerson: formVals.contactPerson.trim(),
      email: formVals.email.trim(),
      phone: formVals.phone.trim(),
      city: formVals.city.trim(),
      state: formVals.billingState,
      address: formVals.billingAddress.trim(),
      billingAddress: formVals.billingAddress.trim(),
      shippingAddress: finalShipAddr.trim(),
      billingState: formVals.billingState,
      shippingState: finalShipState,
      gstin: formVals.gstin ? formVals.gstin.trim().toUpperCase() : '',
      outstandingBalance: 0,
      creditLimit: Number(formVals.creditLimit),
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  // STRICTLY 4 COLUMNS AS MANDATED BY REQUIREMENTS
  const columns: ColumnDef<Customer>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
      render: (c) => (
        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-md inline-block whitespace-nowrap">
          {c.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer / Company Name',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
            {c.name}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
            <span>GSTIN: {c.gstin || 'Unregistered'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (c) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1">
            <span>{c.contactPerson || '—'}</span>
          </div>
          <div className="text-slate-500 flex items-center gap-1">
            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[200px]">{c.email}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
            <span>{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding Balance & Location',
      sortable: true,
      align: 'right',
      render: (c) => (
        <div className="text-right">
          <div className="font-mono font-bold text-sm text-amber-600">
            ₹{(c.outstandingBalance || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span>
              {c.city}, {c.billingState || c.state || 'Tamil Nadu'}
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Customer Directory Master</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Main Table: Strictly 4 Columns with Interactive Row Click */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <DataTable
          data={customers}
          columns={columns}
          searchPlaceholder="Search by customer code, company name, contact, city, or GSTIN..."
          searchKeys={['name', 'contactPerson', 'city', 'gstin', 'code', 'email', 'phone']}
          pageSizeDefault={10}
          onRowClick={(cust) => {
            window.history.pushState({}, '', `/customers/${cust.id}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        />
      </div>

      {/* Slide-over Customer Details Drawer */}
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        onGenerateInvoice={(custId) => {
          if (onNavigateToInvoiceCreate) {
            onNavigateToInvoiceCreate(custId);
          } else {
            window.location.href = `/invoices/new?customerId=${custId}`;
          }
        }}
      />

      {/* 3-Tier Validated Modal: Add Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg h-[90vh] max-h-[740px] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0 bg-slate-50/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Register New Customer Master</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  3-tier validation (onChange, onBlur, submit) with Indian State & GST check
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit(onSubmitAddCustomer)} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 text-xs">
                {/* Company Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company / Entity Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Bharat Electronics Ltd"
                    className={`w-full rounded-xl border p-2.5 outline-none transition ${touched.name && errors.name
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                      }`}
                  />
                  {touched.name && errors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={values.contactPerson}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. S. Ramanathan"
                      className={`w-full rounded-xl border p-2.5 outline-none transition ${touched.contactPerson && errors.contactPerson
                          ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {touched.contactPerson && errors.contactPerson && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.contactPerson}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. 9840123456"
                      className={`w-full rounded-xl border p-2.5 outline-none font-mono transition ${touched.phone && errors.phone
                          ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {touched.phone && errors.phone && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. accounts@bharatelectronics.com"
                    className={`w-full rounded-xl border p-2.5 outline-none transition ${touched.email && errors.email
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                      }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* City & Indian Billing State Combobox */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Chennai"
                      className={`w-full rounded-xl border p-2.5 outline-none transition ${touched.city && errors.city
                          ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Indian Billing State <span className="text-rose-500">*</span>
                    </label>
                    <Combobox
                      options={stateOptions}
                      value={values.billingState}
                      onChange={(val) => {
                        setFieldValue('billingState', val);
                      }}
                      placeholder="Search Indian State..."
                    />
                  </div>
                </div>

                {/* Full Billing Address */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="billingAddress"
                    value={values.billingAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter registered physical billing address..."
                    className={`w-full rounded-xl border p-2.5 outline-none transition resize-none ${touched.billingAddress && errors.billingAddress
                        ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                      }`}
                  />
                  {touched.billingAddress && errors.billingAddress && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{errors.billingAddress}</p>
                  )}
                </div>

                {/* Separate Shipping Address Toggle */}
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.sameAsBilling}
                      onChange={(e) => setFieldValue('sameAsBilling', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-800 text-xs">
                      Shipping Address is identical to Billing Address
                    </span>
                  </label>

                  {!values.sameAsBilling && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Shipping State</label>
                        <Combobox
                          options={stateOptions}
                          value={values.shippingState}
                          onChange={(val) => setFieldValue('shippingState', val)}
                          placeholder="Select Shipping State..."
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Shipping Address</label>
                        <textarea
                          rows={2}
                          name="shippingAddress"
                          value={values.shippingAddress}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter consignee / delivery site address..."
                          className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* GSTIN & Credit Limit (> 10,000) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      value={values.gstin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="e.g. 33AAACB1234P1Z1"
                      className={`w-full rounded-xl border p-2.5 outline-none font-mono uppercase transition ${touched.gstin && errors.gstin
                          ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {touched.gstin && errors.gstin && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.gstin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Credit Limit (₹) <span className="text-rose-500">* (&gt; ₹10,000)</span>
                    </label>
                    <input
                      type="number"
                      name="creditLimit"
                      min={10001}
                      value={values.creditLimit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Minimum ₹10,001"
                      className={`w-full rounded-xl border p-2.5 outline-none font-mono transition ${touched.creditLimit && errors.creditLimit
                          ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {touched.creditLimit && errors.creditLimit && (
                      <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.creditLimit}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 shrink-0 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Customer Master</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Export Modal */}
      <ExportModal<Customer>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Customers Master"
        filenamePrefix="Customers"
        columns={exportColumns}
        data={customers}
        dateField="createdAt"
      />
    </div>
  );
};
