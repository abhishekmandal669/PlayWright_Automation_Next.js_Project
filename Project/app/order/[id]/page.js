import OrderDetailClient from '../../orders/[id]/OrderDetailClient';

export const metadata = {
  title: 'Freight Proxy | Shipment Waybill Inspection',
  description: 'Full-page shipment tracking and volumetric freight waybill inspection.',
};

export default function OrderViewPage({ params }) {
  return <OrderDetailClient orderId={params.id} />;
}
