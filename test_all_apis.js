const baseUrl = 'http://localhost:3000';

async function run() {
  console.log('====================================================');
  console.log('       HEMA\'S BOUTIQUE - COMPLETE API TEST SUITE     ');
  console.log('====================================================\n');

  const results = [];

  function record(name, passed, detail) {
    results.push({ name, passed, detail });
    console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} - ${detail}`);
  }

  // 1. Health API
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    record('Health Check', res.ok && data.status === 'healthy', `Status: ${data.status}, DB: ${data.services?.database}`);
  } catch (e) {
    record('Health Check', false, e.message);
  }

  // 2. Categories API (Public GET)
  let testCategoryId = null;
  try {
    const res = await fetch(`${baseUrl}/api/categories`);
    const data = await res.json();
    const count = data.categories?.length || 0;
    testCategoryId = data.categories?.[0]?.id;
    record('Categories List (Public)', res.ok && Array.isArray(data.categories), `Fetched ${count} categories`);
  } catch (e) {
    record('Categories List (Public)', false, e.message);
  }

  // 3. Products API (Public GET)
  let testVariantId = null;
  let testProductId = null;
  try {
    const res = await fetch(`${baseUrl}/api/products`);
    const data = await res.json();
    const count = data.products?.length || 0;
    if (count > 0) {
      testProductId = data.products[0].id;
      testVariantId = data.products[0].variants?.[0]?.id;
    }
    record('Products List (Public)', res.ok && Array.isArray(data.products), `Fetched ${count} products, sample: "${data.products?.[0]?.name || 'N/A'}"`);
  } catch (e) {
    record('Products List (Public)', false, e.message);
  }

  // 4. Single Product API (Public GET)
  if (testProductId) {
    try {
      const res = await fetch(`${baseUrl}/api/products/${testProductId}`);
      const data = await res.json();
      record('Single Product Detail', res.ok && data.product?.id === testProductId, `Fetched product: "${data.product?.name}"`);
    } catch (e) {
      record('Single Product Detail', false, e.message);
    }
  }

  // 5. Customer Registration API
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testCustomer = {
    firstName: 'Priya',
    lastName: 'Raman',
    email: `test.customer.${randomSuffix}@hemasboutique.com`,
    password: 'Password@123',
    mobileNumber: `98765${String(randomSuffix).padStart(5, '0')}`,
  };

  let customerCookie = '';
  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCustomer),
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) customerCookie = setCookie.split(';')[0];
    record('Customer Registration', res.ok && data.success, `Created user: ${data.user?.email || testCustomer.email}`);
  } catch (e) {
    record('Customer Registration', false, e.message);
  }

  // 6. Customer Login API
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomer.email,
        password: testCustomer.password,
      }),
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) customerCookie = setCookie.split(';')[0];
    record('Customer Password Login', res.ok && data.success, `Logged in as: ${data.user?.email}`);
  } catch (e) {
    record('Customer Password Login', false, e.message);
  }

  // 7. Customer Auth Me Profile API
  try {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    const data = await res.json();
    record('Customer Profile (Auth Me)', res.ok && data.user?.email === testCustomer.email, `Profile retrieved: ${data.user?.firstName} (${data.user?.role})`);
  } catch (e) {
    record('Customer Profile (Auth Me)', false, e.message);
  }

  // 8. OTP Send API
  let demoOtp = null;
  try {
    const res = await fetch(`${baseUrl}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: testCustomer.email,
        type: 'EMAIL',
        purpose: 'LOGIN',
      }),
    });
    const data = await res.json();
    demoOtp = data.demoOtp;
    record('OTP Send Dispatch', res.ok && data.success, `Dispatched to: ${testCustomer.email} (OTP: ${demoOtp || 'Hidden'})`);
  } catch (e) {
    record('OTP Send Dispatch', false, e.message);
  }

  // 9. OTP Verify API
  if (demoOtp) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: testCustomer.email,
          type: 'EMAIL',
          otp: demoOtp,
          purpose: 'LOGIN',
        }),
      });
      const data = await res.json();
      record('OTP Verification & Login', res.ok && data.success, `Verified successfully, user: ${data.user?.email}`);
    } catch (e) {
      record('OTP Verification & Login', false, e.message);
    }
  }

  // 10. Cart Get (Initial)
  try {
    const res = await fetch(`${baseUrl}/api/cart`, {
      headers: { Cookie: customerCookie },
    });
    const data = await res.json();
    record('Cart Fetch (Initial)', res.ok && Array.isArray(data.items), `Items in cart: ${data.items?.length}`);
  } catch (e) {
    record('Cart Fetch (Initial)', false, e.message);
  }

  // 11. Cart Add Item
  let cartItemId = null;
  if (testVariantId) {
    try {
      const res = await fetch(`${baseUrl}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: customerCookie,
        },
        body: JSON.stringify({ variantId: testVariantId, quantity: 1 }),
      });
      const data = await res.json();
      cartItemId = data.cartItem?.id;
      record('Cart Add Item', res.ok && data.success, `Added variantId: ${testVariantId}, CartItemId: ${cartItemId}`);
    } catch (e) {
      record('Cart Add Item', false, e.message);
    }
  }

  // 12. Cart Update Quantity
  if (cartItemId) {
    try {
      const res = await fetch(`${baseUrl}/api/cart`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: customerCookie,
        },
        body: JSON.stringify({ id: cartItemId, quantity: 2 }),
      });
      const data = await res.json();
      record('Cart Update Quantity', res.ok && data.success, `Updated quantity to 2`);
    } catch (e) {
      record('Cart Update Quantity', false, e.message);
    }
  }

  // 13. Create Cash on Delivery (COD) Order
  const shippingAddress = {
    fullName: 'Priya Raman',
    phone: '9876543210',
    street: '42 Royal Silk Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600017',
    country: 'India',
  };

  let placedOrderId = null;
  try {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        shippingAddress,
        paymentMethod: 'COD',
      }),
    });
    const data = await res.json();
    const order = data.order || data;
    placedOrderId = order.id;
    record('Place Order (Cash On Delivery)', res.ok && (data.success || !!order.id), `Order #${order.orderNumber}, Total: ₹${order.total / 100}, Status: ${order.status}`);
  } catch (e) {
    record('Place Order (Cash On Delivery)', false, e.message);
  }

  // 14. Customer Fetch Orders API
  try {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Cookie: customerCookie },
    });
    const data = await res.json();
    const count = data.orders?.length || 0;
    record('Customer Orders History', res.ok && count > 0, `Customer has ${count} order(s)`);
  } catch (e) {
    record('Customer Orders History', false, e.message);
  }

  // 15. Razorpay Online Order Creation API
  // Add item to cart first
  if (testVariantId) {
    await fetch(`${baseUrl}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
      body: JSON.stringify({ variantId: testVariantId, quantity: 1 }),
    });

    try {
      const res = await fetch(`${baseUrl}/api/checkout/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: customerCookie,
        },
        body: JSON.stringify({ shippingAddress }),
      });
      const data = await res.json();
      record('Razorpay Gateway Order Creation', res.ok && data.success && !!data.razorpayOrderId, `Gateway Order: ${data.razorpayOrderId}, Amount: ₹${data.amount / 100}`);
    } catch (e) {
      record('Razorpay Gateway Order Creation', false, e.message);
    }
  }

  // 16. Admin Login API
  let adminCookie = '';
  try {
    const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hemasboutique.com',
        password: 'Admin@123',
      }),
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) adminCookie = setCookie.split(';')[0];
    record('Admin Staff Login', res.ok && data.success, `Logged in as: ${data.user?.email} (${data.user?.role})`);
  } catch (e) {
    record('Admin Staff Login', false, e.message);
  }

  // 17. Admin Dashboard Analytics Stats API
  try {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const stats = data.stats || data;
    const hasStats = stats.totalOrders !== undefined || stats.totalRevenue !== undefined;
    record('Admin Analytics Stats', res.ok && hasStats, `Revenue: ₹${(stats.totalRevenue || 0) / 100}, Orders: ${stats.totalOrders}, Customers: ${stats.totalUsers}`);
  } catch (e) {
    record('Admin Analytics Stats', false, e.message);
  }

  // 18. Admin Users Directory API
  try {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const count = data.users?.length || 0;
    record('Admin Users Directory', res.ok && Array.isArray(data.users), `Directory contains ${count} user account(s)`);
  } catch (e) {
    record('Admin Users Directory', false, e.message);
  }

  // 19. Admin Orders Scope API
  try {
    const res = await fetch(`${baseUrl}/api/orders?scope=admin`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const count = data.orders?.length || 0;
    record('Admin Orders Management Scope', res.ok && Array.isArray(data.orders), `Admin sees all ${count} orders`);
  } catch (e) {
    record('Admin Orders Management Scope', false, e.message);
  }

  // 20. Admin Category Creation & Deletion Lifecycle
  let tempCatId = null;
  const tempCatName = `Test Collection ${Date.now()}`;
  try {
    const createRes = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ name: tempCatName, description: 'Automated test category' }),
    });
    const createData = await createRes.json();
    tempCatId = createData.category?.id;
    record('Admin Create Category', createRes.ok && !!tempCatId, `Created: "${tempCatName}" (ID: ${tempCatId})`);

    if (tempCatId) {
      const delRes = await fetch(`${baseUrl}/api/categories?id=${tempCatId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      const delData = await delRes.json();
      record('Admin Delete Category', delRes.ok && delData.success, `Deleted category ID: ${tempCatId}`);
    }
  } catch (e) {
    record('Admin Category Lifecycle', false, e.message);
  }

  // 21. Customer Logout API
  try {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: customerCookie },
    });
    record('Customer Logout', res.ok, `Session cleared successfully`);
  } catch (e) {
    record('Customer Logout', false, e.message);
  }

  console.log('\n====================================================');
  console.log('                   FINAL SUMMARY                    ');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} APIs (${Math.round((passedCount / totalCount) * 100)}%)`);
  if (passedCount === totalCount) {
    console.log('🎉 ALL APIs ARE FULLY OPERATIONAL AND WORKING PROPERLY!');
  } else {
    console.log('⚠️ Some APIs failed. Please review details above.');
  }
}

run();
