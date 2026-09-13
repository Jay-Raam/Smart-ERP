import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DeliveryChallan } from '../../store/erpStore';

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
  logisticsBox: {
    marginBottom: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 8,
  },
  logisticsTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  logisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logisticsItem: {
    width: '24%',
  },
  logisticsLabel: {
    fontSize: 7.5,
    color: '#64748b',
  },
  logisticsVal: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },

  declarationBox: {
    marginTop: 20,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  declarationTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 3,
  },
  declarationText: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.3,
  },

  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
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
    marginTop: 35,
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

interface DeliveryChallanPdfProps {
  dc: DeliveryChallan;
}

export const DeliveryChallanPdfDocument: React.FC<DeliveryChallanPdfProps> = ({ dc }) => {
  return (
    <Document title={`Delivery_Challan_${dc.dcNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>SMART ERP ENTERPRISE</Text>
            <Text style={styles.companyText}>Unit 4, Guindy Industrial Estate, Chennai, Tamil Nadu - 600032</Text>
            <Text style={styles.companyText}>GSTIN: 33AAAAA0000A1Z5 | Central Logistics Hub</Text>
            <Text style={styles.companyText}>Helpline: +91 44 2250 8899 | dispatch@smarterp.in</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>DELIVERY CHALLAN</Text>
            <Text style={styles.badge}>Status: {dc.status || 'In Transit'}</Text>
            <Text style={styles.metaText}>DC No: {dc.dcNumber}</Text>
            <Text style={styles.metaText}>Dispatch Date: {dc.dispatchDate}</Text>
            {dc.invoiceNumber && (
              <Text style={styles.metaText}>Tax Invoice Ref: {dc.invoiceNumber}</Text>
            )}
          </View>
        </View>

        {/* Consignor & Consignee */}
        <View style={styles.addressRow}>
          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>DISPATCHED FROM (CONSIGNOR)</Text>
            <Text style={styles.partyName}>SMART ERP ENTERPRISE - PLANT 1</Text>
            <Text style={styles.partyText}>Unit 4, Guindy Industrial Estate, Chennai - 600032</Text>
            <Text style={styles.partyText}>State: Tamil Nadu (Code 33)</Text>
            <Text style={styles.partyText}>GSTIN: 33AAAAA0000A1Z5</Text>
          </View>
          <View style={styles.addressCol}>
            <Text style={styles.addressTitle}>CONSIGNEE / SHIP TO</Text>
            <Text style={styles.partyName}>{dc.customerName}</Text>
            <Text style={styles.partyText}>Delivery Destination on Record</Text>
            <Text style={styles.partyText}>Invoice Ref: {dc.invoiceNumber || 'Direct Transfer'}</Text>
          </View>
        </View>

        {/* Logistics and Vehicle Details */}
        <View style={styles.logisticsBox}>
          <Text style={styles.logisticsTitle}>Logistics & Transport Carrier Details</Text>
          <View style={styles.logisticsGrid}>
            <View style={styles.logisticsItem}>
              <Text style={styles.logisticsLabel}>Vehicle No:</Text>
              <Text style={styles.logisticsVal}>{dc.vehicleNumber}</Text>
            </View>
            <View style={styles.logisticsItem}>
              <Text style={styles.logisticsLabel}>Transport Mode:</Text>
              <Text style={styles.logisticsVal}>{dc.transportMode || 'Road Transport'}</Text>
            </View>
            <View style={styles.logisticsItem}>
              <Text style={styles.logisticsLabel}>E-Way Bill No:</Text>
              <Text style={styles.logisticsVal}>{dc.ewayBillNumber || '—'}</Text>
            </View>
            <View style={styles.logisticsItem}>
              <Text style={styles.logisticsLabel}>Driver Details:</Text>
              <Text style={styles.logisticsVal}>{dc.driverName || '—'}</Text>
              <Text style={styles.logisticsLabel}>{dc.driverPhone}</Text>
            </View>
          </View>
        </View>

        {/* Statutory Declaration */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationTitle}>Statutory Delivery Declaration (Rule 55 CGST Rules)</Text>
          <Text style={styles.declarationText}>
            This Delivery Challan is issued for movement of goods in accordance with Section 31 of the CGST Act 2017 read with Rule 55 of CGST Rules 2017. These goods are being transported for delivery against the referenced Tax Invoice. The recipient driver acknowledges safe receipt of physical packages without transit damage.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureCol}>
            <View style={styles.signLine}>
              <Text style={styles.signText}>Driver / Transporter Signature</Text>
              <Text style={styles.signSub}>Goods received in sealed condition</Text>
            </View>
          </View>
          <View style={styles.signatureCol}>
            <View style={styles.signLine}>
              <Text style={styles.signText}>For SMART ERP ENTERPRISE</Text>
              <Text style={styles.signSub}>Authorized Dispatch Officer</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
