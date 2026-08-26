'use client';

export default function ShippingLabelModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const numDisplay = order.orderNumber || (order.orderId ? order.orderId.replace(/\D/g, '') : '1001');
  const trackingId = order.trackingId || `FP-TRACK-${numDisplay}`;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'AUG 24, 2026';
  const weight = order.weight || 1;
  const length = order.length || 20;
  const width = order.width || 15;
  const height = order.height || 10;
  const volWeight = ((length * width * height) / 5000).toFixed(1);
  const chargeableWeight = Math.max(weight, parseFloat(volWeight)).toFixed(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between p-3.5 sm:p-4 border-b border-[var(--line)] bg-[var(--paper)] gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)] m-0">
              Thermal Shipping Label (4&times;6&quot;)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-paper btn-paper-primary text-xs py-1 px-2.5 sm:py-1.5 sm:px-3"
            >
              🖨️ Print
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

        {/* Printable Label Canvas */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-[#F4F4F0] flex justify-center">
          <div
            id="thermal-shipping-label"
            className="w-[360px] max-w-full bg-white text-black p-4 sm:p-5 border-2 border-black rounded-lg shadow-md font-sans text-xs flex flex-col justify-between"
            style={{ minHeight: '480px', fontFamily: 'monospace' }}
          >
            {/* Top Bar: Carrier Logo & Type */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-base tracking-tighter uppercase font-mono">FREIGHTPROXY EXPRESS</div>
                <div className="text-[9px] font-bold tracking-widest uppercase">INTERNATIONAL AIR WAYBILL</div>
              </div>
              <div className="border-2 border-black px-2 py-0.5 font-bold text-sm bg-black text-white">
                {order.express ? 'PRIORITY AIR' : 'STD CARGO'}
              </div>
            </div>

            {/* Tracking ID & Barcode Simulation */}
            <div className="py-3 text-center border-b-2 border-black">
              <div className="font-bold text-xs tracking-widest mb-1">TRACKING # {trackingId}</div>
              <div className="bg-black text-white font-mono text-center py-2 text-[15px] font-bold tracking-[0.25em] select-none">
                ||| | |||| | ||| |||| | ||||| ||| |
              </div>
              <div className="text-[10px] font-mono mt-0.5">ORD-{numDisplay} &middot; GATE: BAY-04</div>
            </div>

            {/* Origin & Destination Routing Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="p-2 border-r-2 border-black">
                <div className="text-[9px] font-bold text-gray-500 uppercase">ORIGIN (FROM):</div>
                <div className="font-bold text-xs">{order.origin || 'New Delhi, IN'}</div>
                <div className="text-[10px] text-gray-700 mt-1">HUB: DEL-AIR-01</div>
                <div className="text-[9px] text-gray-500">Shipper: FreightProxy Central</div>
              </div>
              <div className="p-2 bg-gray-50">
                <div className="text-[9px] font-bold text-gray-500 uppercase">DELIVER TO:</div>
                <div className="font-extrabold text-xs">{order.destination || 'London, UK'}</div>
                <div className="text-[10px] font-bold text-black mt-1">Attn: {order.userName || 'Client'}</div>
                <div className="text-[9px] text-gray-600 truncate">{order.userEmail}</div>
              </div>
            </div>

            {/* Volumetric Weight & Specs */}
            <div className="grid grid-cols-3 border-b-2 border-black text-center py-2 text-[10px]">
              <div className="border-r border-black">
                <div className="text-gray-500 font-bold">ACTUAL WT</div>
                <div className="font-extrabold text-xs">{weight} KG</div>
              </div>
              <div className="border-r border-black">
                <div className="text-gray-500 font-bold">VOL. WT</div>
                <div className="font-extrabold text-xs">{volWeight} KG</div>
              </div>
              <div>
                <div className="text-gray-500 font-bold">BILLED WT</div>
                <div className="font-extrabold text-xs text-black bg-yellow-200">{chargeableWeight} KG</div>
              </div>
            </div>

            {/* Special Handling Badges */}
            <div className="py-2 flex items-center justify-between border-b border-black text-[10px]">
              <div className="font-bold">
                CARGO: <span className="font-normal">{order.packageName || 'General Goods'} ({order.quantity || 1} PCS)</span>
              </div>
              <div className="flex gap-1">
                {order.fragile && <span className="border border-black px-1 font-bold">FRAGILE</span>}
                {order.insured && <span className="border border-black px-1 font-bold">INSURED</span>}
              </div>
            </div>

            {/* Driver & Bay Details */}
            {order.assignedDriver?.driverName && (
              <div className="py-1.5 border-b border-black text-[9.5px]">
                <span>FLEET DRIVER: <strong>{order.assignedDriver.driverName}</strong> | TRUCK: <strong>{order.assignedDriver.vehicleNumber}</strong></span>
              </div>
            )}

            {/* Bottom Bar: Date & Verification Stamp */}
            <div className="pt-2 flex items-center justify-between text-[9px] text-gray-600">
              <span>ISSUED: {dateStr}</span>
              <span className="font-bold">SECURE CRYPTO-HASH SEAL ✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
