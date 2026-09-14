import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PurchaseOrder } from '../../store/erpStore';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
    marginBottom: 10,
  },
  companyDetails: {
    width: '60%',
  },
  companyName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    marginBottom: 3,
  },
  companyText: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.25,
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
    marginBottom: 3,
  },
  badge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.25,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 7,
  },
  addressCol: {
    width: '48%',
  },
  addressTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  partyName: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyText: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.25,
  },
  table: {
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 7.5,
  },
  colNo: { width: '5%', textAlign: 'center' },
  colDesc: { width: '37%' },
  colHsn: { width: '12%', textAlign: 'center' },
  colQty: { width: '10%', textAlign: 'right' },
  colRate: { width: '12%', textAlign: 'right' },
  colGst: { width: '10%', textAlign: 'right' },
  colAmount: { width: '14%', textAlign: 'right' },

  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  wordsBox: {
    width: '56%',
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordsLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  wordsText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  summaryBox: {
    width: '41%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 5,
    backgroundColor: '#ffffff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: '#475569',
  },
  summaryVal: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#2563eb',
    marginTop: 3,
    paddingTop: 3,
  },
  grandTotalLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },

  termsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 6,
    gap: 6,
  },
  termCol: {
    flex: 1,
    padding: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  termText: {
    fontSize: 6.5,
    color: '#475569',
    lineHeight: 1.25,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
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
    marginTop: 22,
    paddingTop: 3,
  },
  signText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  signSub: {
    fontSize: 6.5,
    color: '#64748b',
  },
});

interface PurchaseOrderPdfProps {
  po: PurchaseOrder;
}

export const PurchaseOrderPdfDocument: React.FC<PurchaseOrderPdfProps> = ({ po }) => {
  const items = po.items && po.items.length > 0 ? po.items : [];
  const taxableAmount = po.taxableAmount || po.subtotal || 0;
  const totalAmount = po.totalAmount || 0;

  const defaultInstructions =
    po.instructions ||
    '1. Deliver to Central Stores Receiving Bay, Ambattur between 09:00 AM - 05:00 PM.\n2. Delivery Challan, Packing List & Invoices must strictly cite this PO Number.\n3. Goods must be packaged safely with protective wrapping against transit corrosion.';

  const defaultQualityTerms =
    po.qualityTerms ||
    '1. All supplied materials must strictly match specification tolerances and engineering drawings.\n2. Manufacturer Test Certificate (MTC) and Certificate of Analysis (CoA) required at gate inward.\n3. Defective or non-compliant lots will be rejected with return freight on supplier account.';

  const defaultCommercialTerms =
    po.termsAndConditions ||
    '1. Payment release: 30 days net following successful GRN quality approval.\n2. Prices are firm, fixed and inclusive of transit insurance up to factory delivery point.\n3. Smart ERP reserves statutory right of audit and dispute escalation under Tamil Nadu jurisdiction.';

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
            <Text style={styles.badge}>Status: {po.status || 'APPROVED'}</Text>
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

          {items.map((item, idx) => {
            const itemTotal = item.totalAmount || item.taxableAmount || item.quantity * item.unitPrice;
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colNo}>{idx + 1}</Text>
                <Text style={styles.colDesc}>{item.productName}</Text>
                <Text style={styles.colHsn}>{item.hsnCode || '—'}</Text>
                <Text style={styles.colQty}>
                  {item.quantity} {item.uom || 'Nos'}
                </Text>
                <Text style={styles.colRate}>{item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.colGst}>{item.taxRate ?? 18}%</Text>
                <Text style={styles.colAmount}>{itemTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals & Amount in Words */}
        <View style={styles.totalsSection}>
          <View style={styles.wordsBox}>
            <Text style={styles.wordsLabel}>Amount Chargeable in Words</Text>
            <Text style={styles.wordsText}>
              {po.totalInWords || `INR ${totalAmount.toLocaleString('en-IN')} Only`}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal Taxable:</Text>
              <Text style={styles.summaryVal}>INR {taxableAmount.toFixed(2)}</Text>
            </View>
            {(po.shippingCharge || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Freight / Logistics:</Text>
                <Text style={styles.summaryVal}>INR {(po.shippingCharge || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.cgstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST (Central Tax):</Text>
                <Text style={styles.summaryVal}>INR {(po.cgstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.sgstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST (State Tax):</Text>
                <Text style={styles.summaryVal}>INR {(po.sgstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            {(po.igstAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGST (Integrated Tax):</Text>
                <Text style={styles.summaryVal}>INR {(po.igstAmount || 0).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand PO Value:</Text>
              <Text style={styles.grandTotalVal}>INR {totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* PO Instructions, Quality Terms & Commercial Terms */}
        <View style={styles.termsGrid}>
          <View style={styles.termCol}>
            <Text style={styles.termTitle}>Dispatch & Store Instructions</Text>
            {defaultInstructions.split('\n').filter(Boolean).map((line, lIdx) => (
              <Text key={lIdx} style={styles.termText}>
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.termCol}>
            <Text style={styles.termTitle}>Quality & Inspection Standards</Text>
            {defaultQualityTerms.split('\n').filter(Boolean).map((line, lIdx) => (
              <Text key={lIdx} style={styles.termText}>
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.termCol}>
            <Text style={styles.termTitle}>Commercial Terms & Conditions</Text>
            {defaultCommercialTerms.split('\n').filter(Boolean).map((line, lIdx) => (
              <Text key={lIdx} style={styles.termText}>
                {line}
              </Text>
            ))}
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
