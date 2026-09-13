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
} from 'lucide-react';
import { useErpStore, DeliveryChallan } from '../../store/erpStore';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { Combobox } from '../shared/Combobox';

interface DeliveryModuleProps {
  initialOpenAdd?: boolean;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ initialOpenAdd = false }) => {
  const { deliveryChallans, salesOrders, addDeliveryChallan } = useErpStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [viewDc, setViewDc] = useState<DeliveryChallan | null>(null);

  // Form State
  const [selectedSoId, setSelectedSoId] = useState(salesOrders[0]?.id || '');
  const [transportMode, setTransportMode] = useState('Dedicated Heavy Truck');
  const [vehicleNumber, setVehicleNumber] = useState('TN 09 BY 5521');
  const [ewayBillNumber, setEwayBillNumber] = useState('281099238411');
  const [driverName, setDriverName] = useState('R. Murugan');
  const [driverPhone, setDriverPhone] = useState('+91 98401 99882');

  const filteredChallans = deliveryChallans.filter((dc) => {
    const matchesSearch =
      dc.dcNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dc.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dc.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || dc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDC = (e: React.FormEvent) => {
    e.preventDefault();
    const so = salesOrders.find((s) => s.id === selectedSoId);
    if (!so) return;

    addDeliveryChallan({
      salesOrderNumber: so.orderNumber,
      customerName: so.customerName,
      dispatchDate: new Date().toISOString().split('T')[0],
      transportMode,
      vehicleNumber,
      ewayBillNumber,
      driverName,
      driverPhone,
      status: 'In Transit',
    });

    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<DeliveryChallan>[] = [
    {
      key: 'dcNumber',
      header: 'DC Number',
      sortable: true,
      render: (dc) => <span className="font-mono font-bold text-blue-700">{dc.dcNumber}</span>,
    },
    {
      key: 'salesOrderNumber',
      header: 'SO Reference',
      sortable: true,
      render: (dc) => <span className="font-mono text-slate-600">{dc.salesOrderNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Consignee Customer',
      sortable: true,
      render: (dc) => <span className="font-medium text-slate-900">{dc.customerName}</span>,
    },
    {
      key: 'dispatchDate',
      header: 'Dispatch Date',
      sortable: true,
      render: (dc) => <span className="text-slate-500">{dc.dispatchDate}</span>,
    },
    {
      key: 'transportMode',
      header: 'Transport Mode',
      render: (dc) => <span className="text-slate-600">{dc.transportMode}</span>,
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle Number',
      sortable: true,
      render: (dc) => <span className="font-mono font-semibold text-slate-800">{dc.vehicleNumber}</span>,
    },
    {
      key: 'ewayBillNumber',
      header: 'E-Way Bill No',
      sortable: true,
      render: (dc) => <span className="font-mono text-slate-500">{dc.ewayBillNumber}</span>,
    },
    {
      key: 'driver',
      header: 'Driver Contact',
      render: (dc) => (
        <div className="text-slate-600">
          <div>{dc.driverName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{dc.driverPhone}</div>
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
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>New Delivery Challan</span>
        </button>
      </div>

      {/* Modern Tiaano ERP DataTable */}
      <DataTable
        data={deliveryChallans}
        columns={columns}
        searchPlaceholder="Search DC number, vehicle, customer, or SO..."
        searchKeys={['dcNumber', 'vehicleNumber', 'customerName', 'salesOrderNumber']}
        statusOptions={statusOptions}
        statusKey="status"
        pageSizeDefault={10}
      />

      {/* Modal: Create Delivery Challan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Delivery Challan (DC)</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDC} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Sales Order</label>
                <Combobox
                  value={selectedSoId}
                  onChange={(val) => setSelectedSoId(val)}
                  options={salesOrders.map((so) => ({
                    value: so.id,
                    label: `${so.orderNumber} — ${so.customerName}`,
                    sublabel: `Total: ₹${so.totalAmount.toLocaleString('en-IN')}`,
                  }))}
                  placeholder="Select source sales order..."
                  searchable={true}
                />
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
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Registration No</label>
                  <input
                    type="text"
                    required
                    placeholder="TN 09 BX 4412"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GST E-Way Bill Number</label>
                <input
                  type="text"
                  required
                  placeholder="12-digit E-Way Bill Number"
                  value={ewayBillNumber}
                  onChange={(e) => setEwayBillNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
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
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
