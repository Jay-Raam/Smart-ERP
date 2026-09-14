import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  X,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useErpStore, DeliveryChallan } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';
import { ExportModal, ExportColumn } from '../shared/ExportModal';
import { usePermissions } from '../../hooks/usePermissions';
import { DeliveryChallanPdfDocument } from '../pdf/DeliveryChallanPdfDocument';
import { PdfPreviewModal } from '../pdf/PdfPreviewModal';

interface DeliveryModuleProps {
  initialOpenAdd?: boolean;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ initialOpenAdd = false }) => {
  const { deliveryChallans, invoices, addDeliveryChallan } = useErpStore();
  const { canAdd } = usePermissions('delivery');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [selectedDcForPdf, setSelectedDcForPdf] = useState<DeliveryChallan | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const exportColumns: ExportColumn<DeliveryChallan>[] = [
    { key: 'dcNumber', label: 'Challan No' },
    { key: 'dispatchDate', label: 'Dispatch Date' },
    { key: 'invoiceNumber', label: 'Invoice No' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'transportMode', label: 'Transport Mode' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'ewayBillNumber', label: 'E-Way Bill No' },
    { key: 'driverName', label: 'Driver Name' },
    { key: 'driverPhone', label: 'Driver Phone' },
    { key: 'status', label: 'Status' },
  ];

  // Form State (strictly cleared mock defaults as requested)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
  const [transportMode, setTransportMode] = useState('Dedicated Heavy Truck');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ewayBillNumber, setEwayBillNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // 3-Tier Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'selectedInvoiceId':
        if (!value.trim()) return 'Source tax invoice is required';
        return '';
      case 'vehicleNumber': {
        const val = value.trim().toUpperCase();
        if (!val) return 'Vehicle registration number is mandatory';
        const clean = val.replace(/[\s-]/g, '');
        // Standard Indian vehicle format: State code (2) + District (1-2) + Series (0-3) + Digits (4)
        const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
        if (!vehicleRegex.test(clean)) {
          return 'Enter valid vehicle number (e.g. TN 09 BX 4412)';
        }
        return '';
      }
      case 'ewayBillNumber': {
        const val = value.trim();
        if (!val) return 'GST E-Way Bill number is mandatory';
        if (!/^\d{12}$/.test(val)) {
          return 'E-Way bill number must be exactly 12 numeric digits';
        }
        return '';
      }
      case 'driverName': {
        const val = value.trim();
        if (!val) return 'Driver name is mandatory';
        if (val.length < 2) return 'Driver name must have at least 2 characters';
        return '';
      }
      case 'driverPhone': {
        const val = value.trim();
        if (!val) return 'Driver mobile number is mandatory';
        if (!/^[6-9]\d{9}$/.test(val)) {
          return 'Enter valid 10-digit mobile number (starts with 6-9)';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleOpenAddModal = () => {
    setSelectedInvoiceId(invoices[0]?.id || '');
    setTransportMode('Dedicated Heavy Truck');
    setVehicleNumber('');
    setEwayBillNumber('');
    setDriverName('');
    setDriverPhone('');
    setErrors({});
    setTouched({});
    setIsAddModalOpen(true);
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleCreateDC = (e: React.FormEvent) => {
    e.preventDefault();

    // Level 3 Validation: Full submit validation across all mandatory fields
    const formErrors: Record<string, string> = {
      selectedInvoiceId: validateField('selectedInvoiceId', selectedInvoiceId),
      vehicleNumber: validateField('vehicleNumber', vehicleNumber),
      ewayBillNumber: validateField('ewayBillNumber', ewayBillNumber),
      driverName: validateField('driverName', driverName),
      driverPhone: validateField('driverPhone', driverPhone),
    };

    const hasErrors = Object.values(formErrors).some((err) => Boolean(err));
    if (hasErrors) {
      setErrors(formErrors);
      setTouched({
        selectedInvoiceId: true,
        vehicleNumber: true,
        ewayBillNumber: true,
        driverName: true,
        driverPhone: true,
      });
      return;
    }

    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;

    addDeliveryChallan({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      dispatchDate: new Date().toISOString().split('T')[0],
      transportMode,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      ewayBillNumber: ewayBillNumber.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      status: 'In Transit',
      irn: inv.irn || '',
      signedQrCode: inv.signedQrCode || '',
      totalAmount: inv.totalAmount || 0,
      items: (inv.items || []).map((it) => ({
        productId: it.productId,
        productName: it.productName,
        hsnCode: it.hsnCode || '',
        quantity: it.quantity,
        uom: it.uom || 'PCS',
        unitPrice: it.unitPrice || 0,
        taxRate: it.taxRate || 0,
        taxableAmount: it.taxableAmount || 0,
        totalTax: it.totalTax || 0,
        totalAmount: it.totalAmount || 0,
      })),
    });

    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<DeliveryChallan>[] = [
    {
      key: 'dcNumber',
      header: 'DC Number',
      sortable: true,
      render: (dc) => (
        <span className="font-mono font-bold text-blue-700 whitespace-nowrap">
          {dc.dcNumber}
        </span>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'Invoice Reference',
      sortable: true,
      render: (dc) => (
        <span className="font-mono text-slate-600 whitespace-nowrap">
          {dc.invoiceNumber || '—'}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Consignee Customer',
      sortable: true,
      render: (dc) => (
        <span className="font-medium text-slate-900 whitespace-nowrap">
          {dc.customerName}
        </span>
      ),
    },
    {
      key: 'dispatchDate',
      header: 'Dispatch Date',
      sortable: true,
      render: (dc) => (
        <span className="text-slate-500 whitespace-nowrap">
          {dc.dispatchDate}
        </span>
      ),
    },
    {
      key: 'transportMode',
      header: 'Transport Mode',
      render: (dc) => (
        <span className="text-slate-600 whitespace-nowrap">
          {dc.transportMode}
        </span>
      ),
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle Number',
      sortable: true,
      render: (dc) => (
        <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">
          {dc.vehicleNumber}
        </span>
      ),
    },
    {
      key: 'ewayBillNumber',
      header: 'E-Way Bill No',
      sortable: true,
      render: (dc) => (
        <span className="font-mono text-slate-600 whitespace-nowrap">
          {dc.ewayBillNumber || '—'}
        </span>
      ),
    },
    {
      key: 'driver',
      header: 'Driver Contact',
      render: (dc) => (
        <div className="text-slate-600 whitespace-nowrap">
          <div className="font-medium text-slate-900">{dc.driverName || '—'}</div>
          <div className="text-[11px] text-slate-400 font-mono">{dc.driverPhone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Delivery Status',
      sortable: true,
      align: 'center',
      render: (dc) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
            dc.status === 'Delivered'
              ? 'badge-success'
              : 'badge-info'
          }`}
        >
          {dc.status === 'Delivered' && <CheckCircle2 className="h-3 w-3" />}
          {dc.status === 'In Transit' && <Clock className="h-3 w-3" />}
          {dc.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (dc) => (
        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setSelectedDcForPdf(dc)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Preview and Download Delivery Challan PDF"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>PDF</span>
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'In Transit', value: 'In Transit' },
    { label: 'Delivered', value: 'Delivered' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Delivery Challans & Dispatch</h2>
          <p className="text-xs text-slate-500">
            Factory dispatches, logistics carrier tracking, and GST E-Way bill reconciliation
          </p>
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
          {canAdd && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Delivery Challan</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Smart ERP DataTable */}
      <DataTable
        data={deliveryChallans}
        columns={columns}
        searchPlaceholder="Search DC number, vehicle, customer, or invoice..."
        searchKeys={['dcNumber', 'vehicleNumber', 'customerName', 'invoiceNumber']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* Modal: Create Delivery Challan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Delivery Challan (DC)</h3>
                <p className="text-[11px] text-slate-500">Official dispatch note under Rule 55 CGST Rules</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDC} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Source Tax Invoice <span className="text-rose-500">*</span>
                </label>
                <Combobox
                  value={selectedInvoiceId}
                  onChange={(val) => {
                    setSelectedInvoiceId(val);
                    if (touched.selectedInvoiceId) {
                      setErrors((prev) => ({ ...prev, selectedInvoiceId: validateField('selectedInvoiceId', val) }));
                    }
                  }}
                  options={invoices.map((inv) => ({
                    value: inv.id,
                    label: `${inv.invoiceNumber} — ${inv.customerName}`,
                    sublabel: `Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}${inv.irn ? ' • IRN Registered' : ''}`,
                  }))}
                  placeholder="Select source tax invoice..."
                  searchable={true}
                />
                {touched.selectedInvoiceId && errors.selectedInvoiceId && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.selectedInvoiceId}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transport Mode</label>
                  <Combobox
                    value={transportMode}
                    onChange={(val) => setTransportMode(val)}
                    options={[
                      { value: 'Dedicated Heavy Truck', label: 'Dedicated Heavy Truck' },
                      { value: 'VRL Logistics Express', label: 'VRL Logistics Express' },
                      { value: 'BlueDart Air Cargo', label: 'BlueDart Air Cargo' },
                      { value: 'Customer Pick-Up', label: 'Customer Pick-Up (Self)' },
                    ]}
                    placeholder="Select transport mode..."
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vehicle Registration No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TN 09 BX 4412"
                    value={vehicleNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setVehicleNumber(val);
                      if (touched.vehicleNumber) {
                        setErrors((prev) => ({ ...prev, vehicleNumber: validateField('vehicleNumber', val) }));
                      }
                    }}
                    onBlur={(e) => handleFieldBlur('vehicleNumber', e.target.value)}
                    className={`w-full rounded-lg border p-2.5 outline-none font-mono uppercase transition ${
                      touched.vehicleNumber && errors.vehicleNumber
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {touched.vehicleNumber && errors.vehicleNumber && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.vehicleNumber}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GST E-Way Bill Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="12-digit E-Way Bill Number (e.g. 281099238411)"
                  value={ewayBillNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setEwayBillNumber(digits);
                    if (touched.ewayBillNumber) {
                      setErrors((prev) => ({ ...prev, ewayBillNumber: validateField('ewayBillNumber', digits) }));
                    }
                  }}
                  onBlur={(e) => handleFieldBlur('ewayBillNumber', e.target.value)}
                  className={`w-full rounded-lg border p-2.5 outline-none font-mono transition ${
                    touched.ewayBillNumber && errors.ewayBillNumber
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {touched.ewayBillNumber && errors.ewayBillNumber && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.ewayBillNumber}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Driver Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Full driver name"
                    value={driverName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDriverName(val);
                      if (touched.driverName) {
                        setErrors((prev) => ({ ...prev, driverName: validateField('driverName', val) }));
                      }
                    }}
                    onBlur={(e) => handleFieldBlur('driverName', e.target.value)}
                    className={`w-full rounded-lg border p-2.5 outline-none transition ${
                      touched.driverName && errors.driverName
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {touched.driverName && errors.driverName && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.driverName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Driver Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={driverPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setDriverPhone(digits);
                      if (touched.driverPhone) {
                        setErrors((prev) => ({ ...prev, driverPhone: validateField('driverPhone', digits) }));
                      }
                    }}
                    onBlur={(e) => handleFieldBlur('driverPhone', e.target.value)}
                    className={`w-full rounded-lg border p-2.5 outline-none font-mono transition ${
                      touched.driverPhone && errors.driverPhone
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {touched.driverPhone && errors.driverPhone && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.driverPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 cursor-pointer transition shadow-xs"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Document Preview & Download Modal */}
      {selectedDcForPdf && (
        <PdfPreviewModal
          isOpen={true}
          onClose={() => setSelectedDcForPdf(null)}
          title={`Delivery Challan #${selectedDcForPdf.dcNumber}`}
          fileName={`Delivery_Challan_${selectedDcForPdf.dcNumber}.pdf`}
          document={<DeliveryChallanPdfDocument dc={selectedDcForPdf} />}
        />
      )}

      {/* Reusable Export Modal */}
      <ExportModal<DeliveryChallan>
        show={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Delivery Challans"
        filenamePrefix="Delivery-Challans"
        columns={exportColumns}
        data={deliveryChallans}
        dateField="dispatchDate"
        statusField="status"
        statusOptions={statusOptions}
      />
    </div>
  );
};
