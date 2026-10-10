import { Invoice, IInvoice } from '../models/ErpModels';

export interface IOverdueReminderItem {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  emailSubject: string;
  emailBodyRfc822: string;
  mailtoUrl: string;
  whatsappMessage: string;
  whatsappUrl: string;
  upiPaymentString: string;
  status: 'QUEUED' | 'SENT_LOGGED';
}

export interface IReminderBatchSummary {
  totalOverdueInvoices: number;
  totalReceivableAtRisk: number;
  averageOverdueDays: number;
  reminders: IOverdueReminderItem[];
  dispatchedAt: string;
}

export class ReminderService {
  /**
   * Find all overdue invoices and assemble free open-source Email (RFC822/mailto) and WhatsApp (wa.me) reminders
   */
  static async getOverdueReminders(
    organisationId?: string,
    branchId?: string,
    minOverdueDays: number = 0
  ): Promise<IReminderBatchSummary> {
    const today = new Date().toISOString().split('T')[0];

    const filter: Record<string, any> = {
      dueDate: { $lt: today },
      paymentStatus: { $ne: 'PAID' },
    };

    if (organisationId) filter.organisationId = organisationId;
    if (branchId) filter.branchId = branchId;

    const overdueInvoices = await Invoice.find(filter).sort({ dueDate: 1 }).lean();

    const reminders: IOverdueReminderItem[] = [];
    let totalReceivableAtRisk = 0;
    let totalDays = 0;

    for (const inv of overdueInvoices) {
      const dueTime = new Date(inv.dueDate).getTime();
      const nowTime = new Date(today).getTime();
      const daysOverdue = Math.max(1, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));

      if (daysOverdue < minOverdueDays) continue;

      const outstanding = inv.outstandingAmount > 0 ? inv.outstandingAmount : inv.totalAmount - (inv.paidAmount || 0);
      totalReceivableAtRisk += outstanding;
      totalDays += daysOverdue;

      const customerPhone = inv.billingAddress?.match(/\b\d{10}\b/)?.[0] || '9840123456';
      const customerEmail = inv.billingAddress?.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || `accounts@${inv.customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

      const upiId = 'finance@smart.com';
      const companyName = 'Smart Enterprise ERP';
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${outstanding}&cu=INR&tn=${encodeURIComponent(`Settlement for Inv ${inv.invoiceNumber}`)}`;

      // 1. Free Open Source WhatsApp Message & Universal wa.me Deep-link
      const waText = [
        `*URGENT: Payment Reminder from ${companyName}* ⚠️`,
        ``,
        `Dear *${inv.customerName}*,`,
        `Tax Invoice *#${inv.invoiceNumber}* dated ${inv.invoiceDate} was due on *${inv.dueDate}* (*${daysOverdue} days overdue*).`,
        ``,
        `💰 *Outstanding Balance:* ₹${outstanding.toLocaleString('en-IN')}`,
        `🏦 *Bank Account:* HDFC Bank Ltd | A/C: 50200088912441 | IFSC: HDFC0000240`,
        `⚡ *Instant UPI Settlement:* ${upiString}`,
        ``,
        `Kindly settle the outstanding dues at your earliest convenience or share the UTR payment reference.`,
        `Thank you for your business.`,
      ].join('\n');

      const sanitizedPhone = customerPhone.replace(/\D/g, '').replace(/^0+/, '');
      const fullPhone = sanitizedPhone.length === 10 ? `91${sanitizedPhone}` : sanitizedPhone;
      const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(waText)}`;

      // 2. Free Open Source Email Subject, RFC822 Body & Universal mailto: Link
      const emailSubject = `Payment Reminder: Overdue Tax Invoice #${inv.invoiceNumber} (₹${outstanding.toLocaleString('en-IN')})`;
      const emailBodyPlain = [
        `Dear ${inv.customerName} Accounts Team,`,
        ``,
        `This is a courtesy reminder that payment for Tax Invoice #${inv.invoiceNumber} (Issued: ${inv.invoiceDate}) was due on ${inv.dueDate} and is now ${daysOverdue} days past due.`,
        ``,
        `Invoice Summary:`,
        `- Invoice Number: ${inv.invoiceNumber}`,
        `- Due Date: ${inv.dueDate} (${daysOverdue} days overdue)`,
        `- Total Invoiced: ₹${inv.totalAmount.toLocaleString('en-IN')}`,
        `- Amount Outstanding: ₹${outstanding.toLocaleString('en-IN')}`,
        ``,
        `Remittance Bank Details:`,
        `- Beneficiary: ${companyName}`,
        `- Bank: HDFC Bank Ltd`,
        `- Account Number: 50200088912441`,
        `- IFSC Code: HDFC0000240`,
        `- Branch: Guindy Industrial Estate, Chennai`,
        ``,
        `If payment has already been initiated, please share the UTR/transaction details with us.`,
        ``,
        `Best regards,`,
        `Finance & Accounts Department`,
        `${companyName}`,
      ].join('\n');

      const mailtoUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyPlain)}`;

      const emailBodyRfc822 = [
        `From: "${companyName} Accounts" <finance@smart.com>`,
        `To: "${inv.customerName}" <${customerEmail}>`,
        `Date: ${new Date().toUTCString()}`,
        `Subject: ${emailSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        emailBodyPlain,
      ].join('\r\n');

      reminders.push({
        invoiceId: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerEmail,
        customerPhone: fullPhone,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        daysOverdue,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount || 0,
        outstandingAmount: outstanding,
        emailSubject,
        emailBodyRfc822,
        mailtoUrl,
        whatsappMessage: waText,
        whatsappUrl,
        upiPaymentString: upiString,
        status: 'QUEUED',
      });
    }

    return {
      totalOverdueInvoices: reminders.length,
      totalReceivableAtRisk: Math.round(totalReceivableAtRisk),
      averageOverdueDays: reminders.length > 0 ? Math.round(totalDays / reminders.length) : 0,
      reminders,
      dispatchedAt: new Date().toISOString(),
    };
  }

  /**
   * Format overdue reminders into an executive Markdown report for AI chat
   */
  static formatRemindersMarkdown(summary: IReminderBatchSummary): string {
    const lines: string[] = [];
    lines.push('### ⏰ Autonomous Overdue Payment Reminder Engine');
    lines.push('');
    lines.push(`| Telemetry Metric | Value | Operational Status |`);
    lines.push(`| :--- | :--- | :--- |`);
    lines.push(`| **Overdue Invoices Identified** | **${summary.totalOverdueInvoices} Invoices** | ⚠️ Action Required |`);
    lines.push(`| **Total Outstanding Receivables** | **₹${summary.totalReceivableAtRisk.toLocaleString('en-IN')}** | Cash Collection Priority |`);
    lines.push(`| **Average Overdue Age** | **${summary.averageOverdueDays} Days** | Collection Aging |`);
    lines.push(`| **Free Engine Protocols** | **RFC-822 Mail & WhatsApp wa.me** | 100% Free Open-Source |`);
    lines.push('');

    if (summary.reminders.length === 0) {
      lines.push('✅ **Healthy Receivables**: No overdue invoices currently require payment reminders!');
      return lines.join('\n');
    }

    lines.push('#### Overdue Accounts Queued for Reminders:');
    for (const r of summary.reminders.slice(0, 5)) {
      lines.push(`- **${r.customerName}** — Invoice \`${r.invoiceNumber}\``);
      lines.push(`  - Outstanding: **₹${r.outstandingAmount.toLocaleString('en-IN')}** | Overdue: **${r.daysOverdue} days** (Due: ${r.dueDate})`);
      lines.push(`  - 📱 [Launch WhatsApp Reminder](${r.whatsappUrl}) | ✉️ [Open Desktop Email Client](${r.mailtoUrl})`);
    }

    return lines.join('\n');
  }
}
