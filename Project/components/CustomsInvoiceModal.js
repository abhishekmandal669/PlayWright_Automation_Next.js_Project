'use client';

export default function CustomsInvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const numDisplay = order.orderNumber || (order.orderId ? order.orderId.replace(/\D/g, '') : '1001');
  const trackingId = order.trackingId || `FP-TRACK-${numDisplay}`;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'August 24, 2026';
  const totalPrice = parseFloat(order.totalPrice || order.pricing?.totalPrice || 25.0).toFixed(2);
  const declaredValue = (parseFloat(totalPrice) * 3.5).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)] bg-[var(--paper)]">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <h3 className="text-sm font-bold text-[var(--ink)] m-0">
              Commercial Customs Export Invoice &amp; Declaration (A4)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-paper btn-paper-primary text-xs py-1.5 px-3"
            >
              🖨️ Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 overflow-y-auto bg-[#FDFDFC] text-slate-800 text-xs font-sans space-y-5">
          {/* Header Strip */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">FREIGHTPROXY GLOBAL LOGISTICS</h1>
              <p className="text-[11px] text-slate-500">Certified International Air Cargo &amp; Freight Forwarding</p>
              <p className="text-[10px] text-slate-400">Customs Broker License: CBL-99201-AIR &middot; IATA Registered</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                COMMERCIAL INVOICE
              </span>
              <div className="text-xs font-bold font-mono mt-1">INV-EXP-{numDisplay}-2026</div>
              <div className="text-[11px] text-slate-500">Date: {dateStr}</div>
            </div>
          </div>

          {/* Parties: Exporter & Consignee */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. EXPORTER / SHIPPER:</div>
              <div className="font-bold text-xs text-slate-900">FreightProxy Origin Gateway Hub</div>
              <div className="text-slate-600 text-[11px]">{order.origin || 'New Delhi, India'}</div>
              <div className="text-slate-500 text-[10px]">Tax ID / EORI: GB882910294000</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. CONSIGNEE / IMPORTER:</div>
              <div className="font-bold text-xs text-slate-900">{order.userName || 'Client Authorized Signatory'}</div>
              <div className="text-slate-600 text-[11px]">{order.destination || 'London, United Kingdom'}</div>
              <div className="text-slate-500 text-[10px]">Email: {order.userEmail}</div>
            </div>
          </div>

          {/* Tracking & Transport Waybill References */}
          <div className="grid grid-cols-3 gap-2 border border-slate-200 p-2.5 rounded text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">WAYBILL NUMBER</span>
              <strong className="font-mono">ORD-{numDisplay}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">AIR TRACKING ID</span>
              <strong className="font-mono text-blue-700">{trackingId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">INCOTERMS 2026</span>
              <strong>DAP (Delivered at Place)</strong>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-2">Item Description</th>
                  <th className="p-2 text-center">HS Code</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Net Weight</th>
                  <th className="p-2 text-right">Declared Value (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2">
                    <div className="font-bold text-slate-900">{order.packageName || 'Precision Electronic Consignment'}</div>
                    <div className="text-[10px] text-slate-500">Commercial Cargo Goods for Export</div>
                  </td>
                  <td className="p-2 text-center font-mono">8542.31.00</td>
                  <td className="p-2 text-center">{order.quantity || 1} units</td>
                  <td className="p-2 text-right font-mono">{order.weight || 1} kg</td>
                  <td className="p-2 text-right font-mono font-bold">${declaredValue}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">Total Freight &amp; Handling Charge:</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">${totalPrice}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Declaration Statement & Certified Stamp */}
          <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
            <div className="max-w-xs text-[10px] text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-700">Customs Declaration:</p>
              I hereby certify that the information on this invoice is true and correct, and the contents and value of this shipment are as stated above.
            </div>

            <div className="text-center">
              <div className="border border-blue-600 bg-blue-50/50 text-blue-800 p-2 rounded text-[10px] font-bold uppercase tracking-wider">
                ✓ CERTIFIED CUSTOMS SEAL
              </div>
              <div className="text-[9px] text-slate-400 mt-1">Authorized Operations Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
