import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BillRecord, UserProfile, PredictionResult } from '../types';

export function generatePdfReport(
  user: UserProfile,
  records: BillRecord[],
  prediction: PredictionResult | null
) {
  const doc = new jsPDF();

  // Header background banner
  doc.setFillColor(16, 185, 129); // Energy Green (#10b981)
  doc.rect(0, 0, 210, 35, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Smart Energy Monitor - Usage Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated on: ' + new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }), 14, 28);

  // User details card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 38, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Summary & Regional Config', 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Account Holder: ${user.name || 'User'}`, 20, 58);
  doc.text(`Email Address: ${user.email || 'N/A'}`, 20, 65);
  doc.text(`State & Board: ${user.state || 'Tamil Nadu'} - ${user.board || 'TANGEDCO (TNEB)'}`, 20, 72);

  doc.text(`Total Bills Logged: ${records.length}`, 120, 58);
  doc.text(`Monthly Budget Limit: Rs. ${user.budgetLimit || 2000}`, 120, 65);
  if (prediction) {
    doc.text(`Next Month Forecast: ${prediction.predictedUnits} kWh (Rs. ${prediction.predictedAmount})`, 120, 72);
  }

  // Table of Bill History
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Logged Electricity Bills', 14, 90);

  const tableData = records.map((record) => [
    record.scanDate,
    record.billingPeriod || 'Monthly',
    `${record.units} kWh`,
    `Rs. ${record.amount.toFixed(2)}`,
    record.tariffSlab || 'Standard',
    record.status,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['Scan Date', 'Period', 'Units Consumed', 'Amount (INR)', 'Tariff Slab Tier', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });

  // Footer / Tips
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 200;

  if (finalY < 250) {
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14, finalY + 10, 182, 25, 3, 3, 'F');

    doc.setTextColor(55, 48, 163);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Energy Conservation Tip:', 20, finalY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      'Shifting major cooling load (AC at 24°C vs 18°C) saves up to 24% electricity per month.',
      20,
      finalY + 26
    );
  }

  // Save PDF file
  doc.save(`Smart_Energy_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
