import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Invoice } from '../../store/erpStore';
import { calculateDocumentTaxes, convertNumberToIndianWords, isStateTamilNadu } from '../../utils/taxCalculation';

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
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colNo: { width: '5%', textAlign: 'center', fontSize: 7.5 },
  colItem: { width: '35%', fontSize: 8 },
  colHsn: { width: '12%', textAlign: 'center', fontSize: 7.5 },
  colQty: { width: '8%', textAlign: 'right', fontSize: 7.5 },
  colRate: { width: '12%', textAlign: 'right', fontSize: 7.5 },
  colTax: { width: '10%', textAlign: 'right', fontSize: 7.5 },
  colTotal: { width: '18%', textAlign: 'right', fontSize: 8 },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    fontSize: 7.5,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wordsContainer: {
    width: '55%',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalsContainer: {
    width: '42%',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2563eb',
  },
  hsnTable: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
  signatoryBox: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
});

interface InvoicePdfDocumentProps {
  invoice: Invoice;
  organisation?: any;
  branch?: any;
}

export const InvoicePdfDocument: React.FC<InvoicePdfDocumentProps> = ({
  invoice,
  organisation = {
    name: 'Smart Enterprise Industries Ltd.',
    cin: 'U29100TN2026PLC089211',
    gstin: '33AAACT1024K1Z8',
    pan: 'AAACT1024K',
    email: 'accounts@smarterp.com',
    phone: '+91 44 2839 4910',
    address: 'Plot 48/A, Industrial Estate, Guindy, Chennai - 600032, Tamil Nadu, India',
  },
  branch,
}) => {
  const isTN = isStateTamilNadu(invoice.customerState || invoice.billingAddress, invoice.customerGstin);

  const taxResult = calculateDocumentTaxes(
    invoice.items && invoice.items.length > 0 ? invoice.items : [],
    invoice.customerState || 'Tamil Nadu',
    invoice.customerGstin,
    Number(invoice.shippingCharge) || 0
  );

  return (
    <Document title={`Invoice-${invoice.invoiceNumber}`} author="Smart Enterprise ERP">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{organisation.name}</Text>
            <Text style={styles.companyText}>{branch?.address || organisation.address}</Text>
            <Text style={styles.companyText}>
              GSTIN: {branch?.gstin || organisation.gstin} | CIN: {organisation.cin} | PAN: {organisation.pan}
            </Text>
            <Text style={styles.companyText}>
              Email: {organisation.email} | Phone: {branch?.phone || organisation.phone}
            </Text>
          </View>

          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>TAX INVOICE</Text>
            <Text style={styles.badge}>{isTN ? 'INTRA-STATE (CGST + SGST)' : 'INTER-STATE (IGST)'}</Text>
            <Text style={styles.metaText}>Invoice No: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.invoiceNumber}</Text></Text>
            <Text style={styles.metaText}>Invoice Date: {invoice.invoiceDate}</Text>
            <Text style={styles.metaText}>Due Date: {invoice.dueDate}</Text>
            <Text style={styles.metaText}>Fiscal Year: {invoice.financialYear || '2026-2027'}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.addressRow}>
          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>Billed To (Customer / Buyer)</Text>
            <Text style={styles.partyName}>{invoice.customerName}</Text>
            <Text style={styles.partyText}>{invoice.billingAddress || 'Tamil Nadu, India'}</Text>
            <Text style={[styles.partyText, { marginTop: 2 }]}>
              GSTIN: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.customerGstin || 'Unregistered'}</Text>
            </Text>
            <Text style={styles.partyText}>State: {invoice.customerState || 'Tamil Nadu'}</Text>
          </View>

          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>Shipped To (Consignee)</Text>
            <Text style={styles.partyName}>{invoice.customerName}</Text>
            <Text style={styles.partyText}>{invoice.shippingAddress || invoice.billingAddress || 'Tamil Nadu, India'}</Text>
            <Text style={[styles.partyText, { marginTop: 2 }]}>
              Place of Supply: {invoice.customerState || 'Tamil Nadu'}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.tableHeaderText]}>#</Text>
            <Text style={[styles.colItem, styles.tableHeaderText]}>Product / Description</Text>
            <Text style={[styles.colHsn, styles.tableHeaderText]}>HSN/SAC</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colRate, styles.tableHeaderText]}>Rate (₹)</Text>
            <Text style={[styles.colTax, styles.tableHeaderText]}>GST %</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>Taxable (₹)</Text>
          </View>

          {taxResult.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colItem}>{item.productName}</Text>
              <Text style={styles.colHsn}>{item.hsnCode || '—'}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>{(item.unitPrice || 0).toFixed(2)}</Text>
              <Text style={styles.colTax}>{item.taxRate}%</Text>
              <Text style={styles.colTotal}>{(item.taxableAmount || 0).toFixed(2)}</Text>
            </View>
          ))}

          {/* Shipping Charge line if present */}
          {taxResult.shippingCharge > 0 && (
            <View style={[styles.tableRow, { backgroundColor: '#faf5ff' }]}>
              <Text style={styles.colNo}>*</Text>
              <Text style={styles.colItem}>Freight / Shipping & Handling Charges</Text>
              <Text style={styles.colHsn}>9965</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colRate}>{taxResult.shippingCharge.toFixed(2)}</Text>
              <Text style={styles.colTax}>18%</Text>
              <Text style={styles.colTotal}>{taxResult.shippingCharge.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* HSN Breakdown Table */}
        <View style={styles.hsnTable}>
          <View style={[styles.tableHeader, { backgroundColor: '#f8fafc' }]}>
            <Text style={[{ width: '20%', fontSize: 7, fontFamily: 'Helvetica-Bold' }]}>HSN/SAC</Text>
            <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Taxable Value</Text>
            {isTN ? (
              <>
                <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>CGST</Text>
                <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>SGST</Text>
              </>
            ) : (
              <Text style={[{ width: '40%', fontSize: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>IGST</Text>
            )}
            <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Total Tax</Text>
          </View>

          {taxResult.hsnSummary.map((hsn, i) => (
            <View key={i} style={[styles.tableRow, { paddingVertical: 3 }]}>
              <Text style={[{ width: '20%', fontSize: 7 }]}>{hsn.hsnCode} ({hsn.taxRate}%)</Text>
              <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right' }]}>{hsn.taxableAmount.toFixed(2)}</Text>
              {isTN ? (
                <>
                  <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right' }]}>{hsn.cgstAmount.toFixed(2)}</Text>
                  <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right' }]}>{hsn.sgstAmount.toFixed(2)}</Text>
                </>
              ) : (
                <Text style={[{ width: '40%', fontSize: 7, textAlign: 'right' }]}>{hsn.igstAmount.toFixed(2)}</Text>
              )}
              <Text style={[{ width: '20%', fontSize: 7, textAlign: 'right' }]}>{hsn.totalTax.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals & Amount in Words */}
        <View style={styles.summaryContainer}>
          <View style={styles.wordsContainer}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#64748b', marginBottom: 2 }}>
              TOTAL IN WORDS (INR):
            </Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a', lineHeight: 1.3 }}>
              {taxResult.totalInWords || convertNumberToIndianWords(taxResult.grandTotal)}
            </Text>

            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b' }}>BANK REMITTANCE DETAILS:</Text>
              <Text style={{ fontSize: 7.5, color: '#334155' }}>Bank: HDFC Bank Ltd | A/C: 50200088912441</Text>
              <Text style={{ fontSize: 7.5, color: '#334155' }}>IFSC: HDFC0000240 | Branch: Guindy Industrial Estate, Chennai</Text>
            </View>
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#475569' }}>Items Subtotal:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>₹{taxResult.subtotal.toFixed(2)}</Text>
            </View>
            {taxResult.shippingCharge > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ color: '#475569' }}>Shipping / Freight:</Text>
                <Text>₹{taxResult.shippingCharge.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={{ color: '#475569' }}>Taxable Amount:</Text>
              <Text>₹{taxResult.taxableAmount.toFixed(2)}</Text>
            </View>
            {isTN ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={{ color: '#475569' }}>CGST:</Text>
                  <Text>₹{taxResult.cgstAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={{ color: '#475569' }}>SGST:</Text>
                  <Text>₹{taxResult.sgstAmount.toFixed(2)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalRow}>
                <Text style={{ color: '#475569' }}>IGST (18%):</Text>
                <Text>₹{taxResult.igstAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#2563eb' }}>Grand Total:</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#2563eb' }}>
                ₹{taxResult.grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Signatory */}
        <View style={styles.signatoryBox}>
          <Text style={{ fontSize: 8, color: '#64748b' }}>For {organisation.name}</Text>
          <View style={{ height: 35 }} />
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>Authorized Signatory</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer generated legal tax invoice under the CGST / SGST / IGST Act, 2017.</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};
