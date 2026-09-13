import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PurchaseOrder } from '../../store/erpStore';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
    marginBottom: 12,
  },
  companyDetails: {
    width: '60%',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.3,
  },
  docMeta: {
    width: '38%',
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 8.5,
    color: '#334155',
    lineHeight: 1.3,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  addressCol: {
    width: '48%',
  },
  addressTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.3,
  },
  table: {
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 8,
  },
  colNo: { width: '6%', textAlign: 'center' },
  colDesc: { width: '36%' },
  colHsn: { width: '12%', textAlign: 'center' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '12%', textAlign: 'right' },
  colGst: { width: '10%', textAlign: 'right' },
  colAmount: { width: '14%', textAlign: 'right' },

  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  wordsBox: {
    width: '56%',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordsLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  wordsText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    fontStyle: 'italic',
  },
  summaryBox: {
    width: '40%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#475569',
  },
  summaryVal: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#2563eb',
    marginTop: 4,
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },

  termsBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 2,
  },
  termsText: {
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.2,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 12,
  },
  signatureCol: {
    width: '45%',
    textAlign: 'center',
    alignItems: 'center',
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    width: '100%',
    marginTop: 30,
    paddingTop: 4,
  },
  signText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  signSub: {
    fontSize: 7,
    color: '#64748b',
  },
});

interface PurchaseOrderPdfProps {
  po: PurchaseOrder;
}

export const PurchaseOrderPdfDocument: React.FC<PurchaseOrderPdfProps> = ({ po }) => {
  return (
    <Document title={`Purchase_Order_${po.poNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>SMART ERP ENTERPRISE</Text>
            <Text style={styles.companyText}>Unit 4, Guindy Industrial Estate, Chennai, Tamil Nadu - 600032</Text>
            <Text style={styles.companyText}>GSTIN: 33AAAAA0000A1Z5 | Corporate PAN: AAAAA0000A</Text>
            <Text style={styles.companyText}>Email: procurement@smarterp.in | Phone: +91 44 2250 8899</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>PURCHASE ORDER</Text>
            <Text style={styles.badge}>Status: {po.status || 'Approved'}</Text>
            <Text style={styles.metaText}>PO No: {po.poNumber}</Text>
            <Text style={styles.metaText}>PO Date: {po.poDate}</Text>
            <Text style={styles.metaText}>Expected Delivery: {po.expectedDate || 'Immediate'}</Text>
          </View>
        </View>

        {/* Vendor & Deliver To */}
        <View style={styles.addressRow}>
          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>VENDOR / SUPPLIER DETAILS</Text>
            <Text style={styles.partyName}>{po.vendorName}</Text>
            <Text style={styles.partyText}>{po.vendorAddress || 'Plant Address on Record'}</Text>
            <Text style={styles.partyText}>State: {po.vendorState || 'Tamil Nadu'}</Text>
            <Text style={styles.partyText}>GSTIN: {po.vendorGstin || 'Unregistered / Not Provided'}</Text>
          </View>
          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>DELIVER TO (FACTORY WAREHOUSE)</Text>
            <Text style={styles.partyName}>SMART ERP ENTERPRISE - CENTRAL STORES</Text>
            <Text style={styles.partyText}>Plot 14-B, SIDCO Industrial Estate, Ambattur, Chennai - 600058</Text>
            <Text style={styles.partyText}>State: Tamil Nadu (Code 33)</Text>
            <Text style={styles.partyText}>Contact: Store Incharge (+91 44 2250 8899)</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>Item Description</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate (INR)</Text>
            <Text style={styles.colGst}>GST %</Text>
            <Text style={styles.colAmount}>Total (INR)</Text>
          </View>

          {po.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colDesc}>{item.productName}</Text>
              <Text style={styles.colHsn}>{item.hsnCode || '—'}</Text>
              <Text style={styles.colQty}>{item.quantity} {item.uom || 'Nos'}</Text>
              <Text style={styles.colRate}>₹{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colGst}>{item.taxRate}%</Text>
              <Text style={styles.colAmount}>₹{(item.totalAmount || item.taxableAmount || item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals & Amount in Words */}
        <View style={styles.totalsSection}>
          <View style={styles.wordsBox}>
            <Text style={styles.wordsLabel}>Amount Chargeable in Words</Text>
            <Text style={styles.wordsText}>
              {po.totalInWords || `Indian Rupees ${po.totalAmount.toLocaleString('en-IN')} Only`}
            </Text>
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>Procurement Terms & Conditions</Text>
              <Text style={styles.termsText}>1. Materials must strictly adhere to specified drawings and metallurgical standards.</Text>
              <Text style={styles.termsText}>2. Delivery Challan and Test Certificates must accompany every dispatch shipment.</Text>
              <Text style={styles.termsText}>3. Payment will be released within 30 days after GRN inspection and Bill approval.</Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal Taxable:</Text>
              <Text style={styles.summaryVal}>₹{(po.taxableAmount || po.subtotal).toFixed(2)}</Text>
            </View>
            {(po.shippingCharge || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Freight / Logistics:</Text>
                <Text style={styles.summaryVal}>₹{(po.shippingCharge || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.cgstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST (Central Tax):</Text>
                <Text style={styles.summaryVal}>₹{(po.cgstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.sgstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST (State Tax):</Text>
                <Text style={styles.summaryVal}>₹{(po.sgstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.igstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGST (Integrated Tax):</Text>
                <Text style={styles.summaryVal}>₹{(po.igstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand PO Value:</Text>
              <Text style={styles.grandTotalVal}>₹{po.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureCol}>
            <View style={styles.signLine}>
              <Text style={styles.signText}>Vendor Acceptance</Text>
              <Text style={styles.signSub}>Authorized Signatory & Stamp</Text>
            </View>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signLine}>
              <Text style={styles.signText}>For SMART ERP ENTERPRISE</Text>
              <Text style={styles.signSub}>Head of Procurement & Quality Assurance</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
