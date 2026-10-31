import { getEnv } from './env'

interface CachedToken {
  token: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null

/**
 * Obtain or reuse a valid Shiprocket JWT Bearer Token (valid for 10 days).
 */
export async function getShiprocketToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token
  }

  const env = getEnv()
  const email = env.SHIPROCKET_EMAIL
  const password = env.SHIPROCKET_PASSWORD

  if (!email || !password) {
    throw new Error('Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are not configured')
  }

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Shiprocket login failed:', errorText)
    throw new Error(`Shiprocket authentication failed with status ${res.status}`)
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error(data.message || 'No token received from Shiprocket')
  }

  // Cache token for 9 days (token is valid for 10 days / 240 hours)
  cachedToken = {
    token: data.token,
    expiresAt: now + 9 * 24 * 60 * 60 * 1000,
  }

  return data.token
}

/**
 * Creates an adhoc order in Shiprocket from a boutique order.
 */
export async function createShiprocketOrder(order: {
  id: string
  orderNumber: string
  createdAt: Date | string
  shippingAddress: string
  total: number
  user?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    mobileNumber?: string | null
  } | null
  items: Array<{
    productName: string
    sku: string
    quantity: number
    price: number
    salePrice?: number | null
  }>
}) {
  const token = await getShiprocketToken()
  const env = getEnv()

  let address: any = {}
  try {
    address = JSON.parse(order.shippingAddress)
  } catch {
    address = {}
  }

  const customerName =
    address.fullName ||
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') ||
    'Customer'

  const rawPhone = address.phone || order.user?.mobileNumber || ''
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10) || '9876543210'

  const orderDate = new Date(order.createdAt)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')

  const payload = {
    order_id: order.orderNumber,
    order_date: orderDate,
    pickup_location: env.SHIPROCKET_PICKUP_LOCATION || 'Home',
    channel_id: '',
    comment: 'Fragile - Boutique Apparel',
    billing_customer_name: customerName,
    billing_last_name: '',
    billing_address: address.street || 'Address',
    billing_address_2: '',
    billing_city: address.city || 'City',
    billing_pincode: address.postalCode || '600001',
    billing_state: address.state || 'Tamil Nadu',
    billing_country: address.country || 'India',
    billing_email: order.user?.email || 'customer@example.com',
    billing_phone: cleanPhone,
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.productName || 'Boutique Apparel',
      sku: item.sku || 'SKU-ITEM',
      units: item.quantity || 1,
      selling_price: ((item.salePrice ?? item.price) / 100).toFixed(2),
      discount: '0',
      tax: '0',
    })),
    payment_method: 'Prepaid',
    sub_total: (order.total / 100).toFixed(2),
    length: 30, // Standard packaging box in cm
    breadth: 25,
    height: 5,
    weight: 0.8, // Default 800g for boutique saree/dress package
  }

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const resData = await res.json()
  return resData
}

/**
 * Assigns the best courier partner and generates an AWB tracking code.
 */
export async function assignShiprocketCourier(shipmentId: number) {
  const token = await getShiprocketToken()

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: shipmentId }),
  })

  return await res.json()
}

/**
 * Generates printable shipping barcode label PDF URL.
 */
export async function generateShiprocketLabel(shipmentId: number) {
  const token = await getShiprocketToken()

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  })

  return await res.json()
}

/**
 * Requests pickup from courier partner at the registered address.
 */
export async function requestShiprocketPickup(shipmentId: number) {
  const token = await getShiprocketToken()

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  })

  return await res.json()
}

/**
 * Fetch live tracking status by AWB code.
 */
export async function trackShiprocketAWB(awbCode: string) {
  const token = await getShiprocketToken()

  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return await res.json()
}

