import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Invoice, OrganisationInfo, Branch, BankAccount } from '../../../store/erpStore';
import { calculateDocumentTaxes, isStateTamilNadu } from '../../../utils/taxCalculation';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  container: {
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  banner: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 5,
  },
  bannerTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  irnBanner: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    padding: 6,
  },
  qrBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#0f172a',
    backgroundColor: '#ffffff',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  companyBox: {
    width: '58%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  metaBox: {
    width: '42%',
    padding: 8,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoBox: {
    width: 22,
    height: 22,
    backgroundColor: '#1d4ed8',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  companyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  branchName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    marginTop: 1,
  },
  companyAddress: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 1.3,
  },
  companyDetailsGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '50%',
    marginBottom: 2,
    fontSize: 7.5,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    fontSize: 7.5,
  },
  metaRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 3,
    fontSize: 7.5,
  },
  sectionTitleBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  partyBox: {
    width: '50%',
    padding: 8,
  },
  partyBoxLeft: {
    width: '50%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  partyName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyAddress: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 4,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    fontSize: 7.5,
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 3.5,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  colSNo: { width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colDesc: { width: '30%', paddingHorizontal: 4, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colHsn: { width: '10%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colQty: { width: '7%', textAlign: 'right', paddingRight: 3, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colUom: { width: '6%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colRate: { width: '12%', textAlign: 'right', paddingRight: 3, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colTotal: { width: '12%', textAlign: 'right', paddingRight: 3, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colDisc: { width: '6%', textAlign: 'right', paddingRight: 3, borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  colSub: { width: '12%', textAlign: 'right', paddingRight: 4 },
  bottomSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  bottomLeft: {
    width: '58%',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    padding: 6,
  },
  bottomRight: {
    width: '42%',
    padding: 6,
    justifyContent: 'space-between',
  },
  hsnTable: {
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    marginBottom: 6,
  },
  hsnRow: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    fontSize: 7,
  },
  hsnHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  inWordsBox: {
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  inWordsTitle: {
    fontSize: 6.5,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  inWordsText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  bankAndTermsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subBox: {
    width: '49%',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    padding: 4,
    fontSize: 7,
  },
  subBoxTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#1e293b',
    marginBottom: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 7.5,
  },
  grandTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 3,
    padding: 5,
    marginTop: 4,
  },
  grandTotalText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  signBlock: {
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  forCompanyText: {
    fontSize: 7.5,
    color: '#64748b',
    marginBottom: 18,
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 2,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  footerNote: {
    fontSize: 6.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
  },
});

interface TaxInvoicePdfDocumentProps {
  invoice: Invoice;
  organisation: OrganisationInfo;
  branch?: Branch;
  bankAccount?: BankAccount;
}

export const TaxInvoicePdfDocument: React.FC<TaxInvoicePdfDocumentProps> = ({
  invoice,
  organisation,
  branch,
  bankAccount,
}) => {
  const isTN = isStateTamilNadu(invoice.customerState || invoice.billingAddress, invoice.customerGstin);

  const taxCalc = calculateDocumentTaxes({
    items: invoice.items && invoice.items.length > 0 ? invoice.items : [
      {
        productName: 'Standard Manufactured Industrial Component Batch',
        hsnCode: '84199090',
        quantity: 1,
        unitPrice: invoice.subtotal || 0,
        taxRate: invoice.gstRate || 18,
        discountAmount: invoice.totalDiscount || 0,
      },
    ],
    billingState: invoice.customerState || 'Tamil Nadu',
    partyGstin: invoice.customerGstin,
  });

  const activeBank = bankAccount || {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088192019',
    ifscCode: 'HDFC0000128',
    branchName: 'Guindy Industrial Estate, Chennai',
  };

  return (
    <Document title={`Tax_Invoice_${invoice.invoiceNumber}.pdf`} author={organisation.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Statutory Indian GST E-Invoice Header Banner if IRN exists */}
          {invoice.irn && (
            <View style={styles.irnBanner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', letterSpacing: 0.5 }}>
                    GOVERNMENT OF INDIA GST E-INVOICE (NIC IRN COMPLIANT)
                  </Text>
                  <Text style={{ fontSize: 6.5, color: '#0f172a', marginTop: 1 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>IRN: </Text>{invoice.irn}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 2, gap: 14 }}>
                    <Text style={{ fontSize: 6.5, color: '#334155' }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold' }}>Ack No: </Text>{invoice.ackNo || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 6.5, color: '#334155' }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold' }}>Ack Date: </Text>{invoice.ackDate || invoice.invoiceDate}
                    </Text>
                    {invoice.ewayBillNumber && (
                      <Text style={{ fontSize: 6.5, color: '#15803d', fontFamily: 'Helvetica-Bold' }}>
                        E-Way Bill: {invoice.ewayBillNumber}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.qrBox}>
                  <Text style={{ fontSize: 5, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#0f172a' }}>
                    NIC GST{'\n'}VERIFIED{'\n'}QR CODE
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Header Title Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>TAX INVOICE</Text>
          </View>

          {/* Company & Invoice Meta */}
          <View style={styles.twoColRow}>
            {/* Left: Company Details */}
            <View style={styles.companyBox}>
              <View style={styles.companyHeader}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>SE</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>{organisation.name}</Text>
                  <Text style={styles.branchName}>{branch?.name || 'Chennai Central HQ & Assembly Plant'}</Text>
                </View>
              </View>
              <Text style={styles.companyAddress}>{branch?.address || organisation.address}</Text>
              <View style={styles.companyDetailsGrid}>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>Phone: </Text>{branch?.phone || organisation.phone}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>Email: </Text>{organisation.email}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>GSTIN: </Text>{branch?.gstin || organisation.gstin}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>CIN: </Text>{organisation.cin}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>State: </Text>Tamil Nadu (33)</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text><Text style={styles.label}>PAN: </Text>{organisation.pan}</Text>
                </View>
              </View>
            </View>

            {/* Right: Invoice Reference Meta */}
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Invoice No:</Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1d4ed8' }}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Invoice Date:</Text>
                <Text>{invoice.invoiceDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Due Date:</Text>
                <Text>{invoice.dueDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Doc Type:</Text>
                <Text>Tax Invoice</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Reverse Charge:</Text>
                <Text>No</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.label}>Place of Supply:</Text>
                <Text>{invoice.customerState || 'Tamil Nadu'}</Text>
              </View>
              <View style={styles.metaRowLast}>
                <Text style={styles.label}>Transport:</Text>
                <Text>Dedicated Heavy Truck</Text>
              </View>
            </View>
          </View>

          {/* 2-Column Parties: Billed To / Shipped To */}
          <View style={styles.twoColRow}>
            {/* Billed To */}
            <View style={styles.partyBoxLeft}>
              <View style={styles.sectionTitleBox}>
                <Text style={styles.sectionTitle}>Billed To (Customer Details)</Text>
              </View>
              <Text style={styles.partyName}>{invoice.customerName}</Text>
              <Text style={styles.partyAddress}>
                {invoice.billingAddress || 'Industrial Complex, Sriperumbudur, Tamil Nadu'}
              </Text>
              <Text style={{ fontSize: 7.5 }}>
                <Text style={styles.label}>GSTIN / UIN: </Text>{invoice.customerGstin || '33AAACB1234P1ZL'}
              </Text>
              <Text style={{ fontSize: 7.5, marginTop: 1 }}>
                <Text style={styles.label}>State: </Text>{invoice.customerState || 'Tamil Nadu'}
              </Text>
            </View>

            {/* Shipped To */}
            <View style={styles.partyBox}>
              <View style={styles.sectionTitleBox}>
                <Text style={styles.sectionTitle}>Shipped To (Delivery Destination)</Text>
              </View>
              <Text style={styles.partyName}>{invoice.customerName}</Text>
              <Text style={styles.partyAddress}>
                {invoice.shippingAddress || invoice.billingAddress || 'Central Stores Unit, Industrial Park, Tamil Nadu'}
              </Text>
              <Text style={{ fontSize: 7.5 }}>
                <Text style={styles.label}>GSTIN / UIN: </Text>{invoice.customerGstin || '33AAACB1234P1ZL'}
              </Text>
              <Text style={{ fontSize: 7.5, marginTop: 1 }}>
                <Text style={styles.label}>State: </Text>{invoice.customerState || 'Tamil Nadu'}
              </Text>
            </View>
          </View>

          {/* Line Items Table */}
          <View style={styles.tableHeader}>
            <Text style={styles.colSNo}>#</Text>
            <Text style={styles.colDesc}>Description of Goods</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUom}>Unit</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colTotal}>Total Amt</Text>
            <Text style={styles.colDisc}>Disc</Text>
            <Text style={styles.colSub}>Sub Total</Text>
          </View>

          {taxCalc.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colSNo}>{index + 1}</Text>
              <View style={styles.colDesc}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{item.productName}</Text>
                {item.sku ? <Text style={{ fontSize: 6.5, color: '#64748b' }}>SKU: {item.sku}</Text> : null}
              </View>
              <Text style={styles.colHsn}>{item.hsnCode}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUom}>{item.uom || 'Nos'}</Text>
              <Text style={styles.colRate}>{item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{item.grossAmount.toFixed(2)}</Text>
              <Text style={styles.colDisc}>{item.discountAmount ? item.discountAmount.toFixed(2) : '-'}</Text>
              <Text style={[styles.colSub, { fontFamily: 'Helvetica-Bold' }]}>{item.taxableAmount.toFixed(2)}</Text>
            </View>
          ))}

          {/* Line Items Footer */}
          <View style={styles.tableFooter}>
            <Text style={[styles.colSNo, { borderRightWidth: 0 }]}></Text>
            <Text style={[styles.colDesc, { textAlign: 'right', paddingRight: 4 }]}>Total Items:</Text>
            <Text style={[styles.colHsn, { borderRightWidth: 0 }]}></Text>
            <Text style={styles.colQty}>{taxCalc.items.reduce((acc, i) => acc + i.quantity, 0)}</Text>
            <Text style={[styles.colUom, { borderRightWidth: 0 }]}></Text>
            <Text style={[styles.colRate, { borderRightWidth: 0 }]}></Text>
            <Text style={[styles.colTotal, { borderRightWidth: 0 }]}></Text>
            <Text style={styles.colDisc}>{taxCalc.totalDiscount.toFixed(2)}</Text>
            <Text style={[styles.colSub, { color: '#1d4ed8', fontFamily: 'Helvetica-Bold' }]}>
              {taxCalc.taxableAmount.toFixed(2)}
            </Text>
          </View>

          {/* Lower Grid: HSN + Bank on Left / Totals on Right */}
          <View style={styles.bottomSection}>
            {/* Left Box */}
            <View style={styles.bottomLeft}>
              {/* HSN Summary */}
              <View style={styles.hsnTable}>
                <View style={styles.hsnHeaderRow}>
                  <Text style={{ width: '22%', paddingLeft: 3 }}>HSN/SAC</Text>
                  <Text style={{ width: '12%', textAlign: 'center' }}>Rate %</Text>
                  <Text style={{ width: '22%', textAlign: 'right', paddingRight: 3 }}>Taxable Value</Text>
                  {isTN ? (
                    <>
                      <Text style={{ width: '15%', textAlign: 'right', paddingRight: 2 }}>CGST</Text>
                      <Text style={{ width: '15%', textAlign: 'right', paddingRight: 2 }}>SGST</Text>
                    </>
                  ) : (
                    <Text style={{ width: '30%', textAlign: 'right', paddingRight: 2 }}>IGST</Text>
                  )}
                  <Text style={{ width: '14%', textAlign: 'right', paddingRight: 3 }}>Total Tax</Text>
                </View>

                {taxCalc.hsnSummary.map((hsn, idx) => (
                  <View key={idx} style={styles.hsnRow}>
                    <Text style={{ width: '22%', paddingLeft: 3, fontFamily: 'Helvetica-Bold' }}>{hsn.hsnCode}</Text>
                    <Text style={{ width: '12%', textAlign: 'center' }}>{hsn.taxRate}%</Text>
                    <Text style={{ width: '22%', textAlign: 'right', paddingRight: 3 }}>{hsn.taxableAmount.toFixed(2)}</Text>
                    {isTN ? (
                      <>
                        <Text style={{ width: '15%', textAlign: 'right', paddingRight: 2 }}>{hsn.cgstAmount.toFixed(2)}</Text>
                        <Text style={{ width: '15%', textAlign: 'right', paddingRight: 2 }}>{hsn.sgstAmount.toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={{ width: '30%', textAlign: 'right', paddingRight: 2 }}>{hsn.igstAmount.toFixed(2)}</Text>
                    )}
                    <Text style={{ width: '14%', textAlign: 'right', paddingRight: 3, fontFamily: 'Helvetica-Bold' }}>
                      {hsn.totalTax.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total in Words */}
              <View style={styles.inWordsBox}>
                <Text style={styles.inWordsTitle}>Total Amount In Words:</Text>
                <Text style={styles.inWordsText}>{taxCalc.totalInWords}</Text>
              </View>

              {/* Bank Details & Terms */}
              <View style={styles.bankAndTermsRow}>
                <View style={styles.subBox}>
                  <Text style={styles.subBoxTitle}>Company Bank Details</Text>
                  <Text><Text style={styles.label}>Bank: </Text>{invoice.bankDetails?.bankName || activeBank.bankName}</Text>
                  <Text><Text style={styles.label}>A/c No: </Text>{invoice.bankDetails?.accountNumber || activeBank.accountNumber}</Text>
                  <Text><Text style={styles.label}>IFSC: </Text>{invoice.bankDetails?.ifscCode || activeBank.ifscCode}</Text>
                  <Text><Text style={styles.label}>Branch: </Text>{invoice.bankDetails?.branchName || activeBank.branchName}</Text>
                </View>
                <View style={styles.subBox}>
                  <Text style={styles.subBoxTitle}>Terms & Conditions</Text>
                  {invoice.termsAndConditions ? (
                    invoice.termsAndConditions.split('\n').filter(Boolean).map((line, idx) => (
                      <Text key={idx}>{line}</Text>
                    ))
                  ) : (
                    <>
                      <Text>1. Goods once sold will not be taken back.</Text>
                      <Text>2. Interest @18% p.a. charged if unpaid by due date.</Text>
                      <Text>3. Subject to jurisdiction of local branch.</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Right Box: Calculation & Signatory */}
            <View style={styles.bottomRight}>
              <View>
                <View style={styles.totalsRow}>
                  <Text style={{ color: '#475569' }}>Total Before Tax:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>₹{taxCalc.taxableAmount.toFixed(2)}</Text>
                </View>

                {isTN ? (
                  <>
                    <View style={styles.totalsRow}>
                      <Text style={{ color: '#475569' }}>Add: CGST ({taxCalc.items[0]?.taxRate ? taxCalc.items[0].taxRate / 2 : 9}%):</Text>
                      <Text>₹{taxCalc.cgstAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                      <Text style={{ color: '#475569' }}>Add: SGST ({taxCalc.items[0]?.taxRate ? taxCalc.items[0].taxRate / 2 : 9}%):</Text>
                      <Text>₹{taxCalc.sgstAmount.toFixed(2)}</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#475569' }}>Add: IGST ({taxCalc.items[0]?.taxRate ?? 18}%):</Text>
                    <Text>₹{taxCalc.igstAmount.toFixed(2)}</Text>
                  </View>
                )}

                <View style={[styles.totalsRow, { borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 2 }]}>
                  <Text style={{ color: '#475569' }}>Total GST Tax:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>₹{taxCalc.totalTax.toFixed(2)}</Text>
                </View>

                <View style={styles.totalsRow}>
                  <Text style={{ color: '#475569' }}>Round Off:</Text>
                  <Text>₹0.00</Text>
                </View>

                <View style={styles.grandTotalBox}>
                  <Text style={styles.grandTotalText}>Total Invoice Amount:</Text>
                  <Text style={styles.grandTotalText}>₹{taxCalc.grandTotal.toFixed(2)}</Text>
                </View>

                <Text style={{ fontSize: 6.5, color: '#94a3b8', textAlign: 'right', marginTop: 2 }}>
                  GST Payable on Reverse Charge: No
                </Text>
              </View>

              {/* Signatory Box */}
              <View style={styles.signBlock}>
                <Text style={styles.forCompanyText}>For {organisation.name}</Text>
                <Text style={styles.signLine}>Authorized Signatory</Text>
                <Text style={styles.footerNote}>This is a Computer Generated Tax Invoice</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
