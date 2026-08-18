// In-memory Freight & Proxy Shipping Orders Store (7-Stage Pipeline)

const orders = [
  {
    id: 'TRK-9001',
    userEmail: 'user@example.com',
    userName: 'Demo User',
    origin: 'New Delhi, India',
    destination: 'London, United Kingdom',
    packageName: 'High-Precision Electronic Sensors',
    quantity: 2,
    weight: 4.5, // kg
    dimensions: { length: 30, width: 25, height: 20 }, // cm
    volumetricWeight: 3.0,
    fragile: true,
    express: true,
    totalPrice: 145.50,
    status: 'OUT_FOR_DELIVERY',
    pickupScheduledDate: '2026-08-16 10:00',
    pickedUpDate: '2026-08-16 11:30',
    warehouseArrivalDate: '2026-08-16 16:45',
    dispatchScheduledDate: '2026-08-17 09:00',
    deliveryScheduledDate: '2026-08-18 18:00',
    createdAt: '2026-08-15'
  },
  {
    id: 'TRK-9002',
    userEmail: 'tomsmith',
    userName: 'Tom Smith',
    origin: 'Mumbai, India',
    destination: 'New York, USA',
    packageName: 'Automotive Component Prototype',
    quantity: 1,
    weight: 8.2,
    dimensions: { length: 45, width: 35, height: 30 },
    volumetricWeight: 9.45,
    fragile: false,
    express: false,
    totalPrice: 210.00,
    status: 'RECEIVED_AT_WAREHOUSE',
    pickupScheduledDate: '2026-08-17 09:30',
    pickedUpDate: '2026-08-17 11:00',
    warehouseArrivalDate: '2026-08-17 15:20',
    dispatchScheduledDate: '2026-08-19 10:30',
    deliveryScheduledDate: 'Pending',
    createdAt: '2026-08-16'
  },
  {
    id: 'TRK-9003',
    userEmail: 'user@example.com',
    userName: 'Demo User',
    origin: 'Bengaluru, India',
    destination: 'Singapore',
    packageName: 'Optical Lenses & Accessories',
    quantity: 5,
    weight: 2.1,
    dimensions: { length: 20, width: 15, height: 10 },
    volumetricWeight: 0.6,
    fragile: true,
    express: true,
    totalPrice: 88.00,
    status: 'PICKUP_SCHEDULED',
    pickupScheduledDate: '2026-08-19 14:00',
    pickedUpDate: 'Pending',
    warehouseArrivalDate: 'Pending',
    dispatchScheduledDate: 'Pending',
    deliveryScheduledDate: 'Pending',
    createdAt: '2026-08-18'
  }
];

export function calculatePrice(weight, length, width, height, fragile, express) {
  const actualW = parseFloat(weight) || 0;
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;

  const volumetricW = (l * w * h) / 5000;
  const chargeableWeight = Math.max(actualW, volumetricW);

  let basePrice = 25.00;
  let weightFee = chargeableWeight * 12.50;
  let fragileFee = fragile ? 15.00 : 0.00;
  let expressFee = express ? 35.00 : 0.00;

  const total = basePrice + weightFee + fragileFee + expressFee;
  return {
    volumetricWeight: volumetricW.toFixed(2),
    chargeableWeight: chargeableWeight.toFixed(2),
    totalPrice: total.toFixed(2)
  };
}

export function getOrders() {
  return orders;
}

export function getOrdersByUser(userEmail) {
  if (!userEmail) return [];
  const cleanEmail = userEmail.trim().toLowerCase();
  return orders.filter((o) => o.userEmail.trim().toLowerCase() === cleanEmail);
}

export function createOrder(orderData) {
  const { volumetricWeight, totalPrice } = calculatePrice(
    orderData.weight,
    orderData.dimensions.length,
    orderData.dimensions.width,
    orderData.dimensions.height,
    orderData.fragile,
    orderData.express
  );

  const newOrder = {
    id: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
    userEmail: orderData.userEmail.trim().toLowerCase(),
    userName: orderData.userName || 'Customer',
    origin: orderData.origin.trim(),
    destination: orderData.destination.trim(),
    packageName: orderData.packageName.trim(),
    quantity: parseInt(orderData.quantity) || 1,
    weight: parseFloat(orderData.weight),
    dimensions: {
      length: parseFloat(orderData.dimensions.length),
      width: parseFloat(orderData.dimensions.width),
      height: parseFloat(orderData.dimensions.height)
    },
    volumetricWeight: parseFloat(volumetricWeight),
    fragile: !!orderData.fragile,
    express: !!orderData.express,
    totalPrice: parseFloat(totalPrice),
    status: 'PICKUP_PENDING',
    pickupScheduledDate: 'Pending',
    pickedUpDate: 'Pending',
    warehouseArrivalDate: 'Pending',
    dispatchScheduledDate: 'Pending',
    deliveryScheduledDate: 'Pending',
    createdAt: new Date().toISOString().split('T')[0]
  };

  orders.unshift(newOrder);
  return newOrder;
}

export function updatePipelineStatus(orderId, updatePayload) {
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    if (updatePayload.status) order.status = updatePayload.status;
    if (updatePayload.pickupScheduledDate) order.pickupScheduledDate = updatePayload.pickupScheduledDate;
    if (updatePayload.pickedUpDate) order.pickedUpDate = updatePayload.pickedUpDate;
    if (updatePayload.warehouseArrivalDate) order.warehouseArrivalDate = updatePayload.warehouseArrivalDate;
    if (updatePayload.dispatchScheduledDate) order.dispatchScheduledDate = updatePayload.dispatchScheduledDate;
    if (updatePayload.deliveryScheduledDate) order.deliveryScheduledDate = updatePayload.deliveryScheduledDate;
    return order;
  }
  return null;
}

export function editOrder(orderId, updateData) {
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    if (updateData.origin) order.origin = updateData.origin;
    if (updateData.destination) order.destination = updateData.destination;
    if (updateData.packageName) order.packageName = updateData.packageName;
    if (updateData.weight) order.weight = parseFloat(updateData.weight);
    if (updateData.totalPrice) order.totalPrice = parseFloat(updateData.totalPrice);
    return order;
  }
  return null;
}
