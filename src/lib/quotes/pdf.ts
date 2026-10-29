import PDFDocument from "pdfkit";
import type { Quote, QuoteLineItem, Client, Organization } from "@prisma/client";
import { formatMoney } from "@/lib/quotes/money";
import { formatEtDate } from "@/lib/quotes/labels";
import { quoteStatusLabel } from "@/lib/quotes/labels";

type PdfQuote = Quote & {
  client: Client | null;
  lineItems: QuoteLineItem[];
};

export async function buildQuotePdfBuffer(
  org: Organization,
  quote: PdfQuote,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .fillColor("#1c1917")
      .text(org.name, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#57534e");
    if (org.address) doc.text(org.address);
    if (org.registryCode) doc.text(`Registrikood: ${org.registryCode}`);
    if (org.vatNumber) doc.text(`KMKR: ${org.vatNumber}`);
    if (org.email || org.phone) {
      doc.text([org.email, org.phone].filter(Boolean).join(" · "));
    }

    doc.moveDown(1.2);
    doc.fontSize(16).fillColor("#1c1917").text("Hinnapakkumine");
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#44403c");
    doc.text(`Number: ${quote.number}`);
    doc.text(`Staatus: ${quoteStatusLabel[quote.status]}`);
    doc.text(`Kuupäev: ${formatEtDate(quote.issueDate)}`);
    if (quote.validUntil) {
      doc.text(`Kehtib kuni: ${formatEtDate(quote.validUntil)}`);
    }

    doc.moveDown(0.8);
    doc.fontSize(11).fillColor("#1c1917").text("Klient");
    doc.fontSize(10).fillColor("#44403c");
    if (quote.client) {
      doc.text(quote.client.name);
      if (quote.client.companyName) doc.text(quote.client.companyName);
      if (quote.client.email) doc.text(quote.client.email);
      if (quote.client.phone) doc.text(quote.client.phone);
    } else {
      doc.text("Klient määramata");
    }

    doc.moveDown(0.8);
    doc.fontSize(12).fillColor("#1c1917").text(quote.title);
    if (quote.description) {
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#57534e").text(quote.description);
    }

    doc.moveDown(1);
    doc.fontSize(10).fillColor("#1c1917");
    const startY = doc.y;
    doc.text("Kirjeldus", 50, startY, { width: 200 });
    doc.text("Kogus", 260, startY, { width: 50 });
    doc.text("Hind", 320, startY, { width: 70 });
    doc.text("KM%", 400, startY, { width: 40 });
    doc.text("Summa", 450, startY, { width: 90, align: "right" });
    doc
      .moveTo(50, startY + 14)
      .lineTo(545, startY + 14)
      .strokeColor("#d6d3d1")
      .stroke();

    let y = startY + 22;
    for (const line of quote.lineItems) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor("#44403c");
      doc.text(line.name, 50, y, { width: 200 });
      doc.text(line.quantity.toString(), 260, y, { width: 50 });
      doc.text(formatMoney(line.unitPrice.toString()), 320, y, { width: 70 });
      doc.text(`${line.vatRate.toString()}%`, 400, y, { width: 40 });
      doc.text(formatMoney(line.lineTotal.toString()), 450, y, {
        width: 90,
        align: "right",
      });
      y += 28;
    }

    doc.y = y + 10;
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#44403c");
    doc.text(`Vahesumma: ${formatMoney(quote.subtotal.toString())}`, {
      align: "right",
    });
    doc.text(`KM kokku: ${formatMoney(quote.vatTotal.toString())}`, {
      align: "right",
    });
    doc
      .fontSize(12)
      .fillColor("#1c1917")
      .text(`Kokku: ${formatMoney(quote.total.toString())}`, { align: "right" });

    doc.end();
  });
}
