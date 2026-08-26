import OrderDetailClient from './OrderDetailClient';

export const metadata = {
  title: 'Freight Proxy | Shipment Waybill Details',
  description: 'Full-page shipment tracking and volumetric freight waybill inspection.',
};

export default function OrderDetailPage({ params }) {
  return <OrderDetailClient orderId={params.id} />;
}
