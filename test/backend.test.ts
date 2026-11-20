import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { runSeed } from "../src/seeds/seed.js";

let server: http.Server;
let baseUrl: string;

before(async () => {
  await connectDatabase();
  await runSeed(true); // Drop and reseed with fresh clean schema

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await disconnectDatabase();
});

describe("UPONTIK REST Backend API Tests", () => {
  test("1. Health check returns status healthy", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.status, "healthy");
  });

  test("2. Categories returns all 5 categories including exact 'Dhol Bag'", async () => {
    const res = await fetch(`${baseUrl}/api/categories`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 5);

    const names = body.data.map((c: any) => c.name);
    assert.ok(names.includes("Dhol Bag"), "Must contain exact category 'Dhol Bag'");
    assert.ok(names.includes("Side Bag"));
    assert.ok(names.includes("Pouch Bag"));
    assert.ok(names.includes("Phone Bag"));
    assert.ok(names.includes("Tote Bag"));
  });

  test("3. Products returns curated artisan products with prices and stock", async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.length > 0);

    const dholProduct = body.data.find(
      (p: any) => p.categorySlug === "dhol-bag" || (p.categoryId && p.categoryId.slug === "dhol-bag")
    );
    assert.ok(dholProduct, "Should have at least one product in dhol-bag category");
    assert.ok(dholProduct.price > 0, "Product must have positive price");
    assert.ok(dholProduct.stock >= 0, "Product must have valid stock count");
  });

  test("4. Coupon validation properly validates active coupon", async () => {
    const res = await fetch(`${baseUrl}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "HERITAGE10", subtotal: 3000 }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.code, "HERITAGE10");
    assert.equal(body.data.discountAmount, 300);
  });

  test("5. User registration & login with JWT verification", async () => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Artisan Patron",
        email: testEmail,
        password: "SecurePassword123!",
      }),
    });
    const regBody = await regRes.json();
    assert.equal(regRes.status, 201);
    assert.equal(regBody.success, true);
    assert.ok(regBody.token || regBody.data?.token);

    // Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "SecurePassword123!",
      }),
    });
    const loginBody = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginBody.success, true);
    assert.ok(loginBody.token || loginBody.data?.token);
  });

  test("6. Master Administrator login & access to protected admin metrics", async () => {
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@upontik.com",
        password: "AdminUpontik2026!",
      }),
    });
    const adminLoginBody = await adminLoginRes.json();
    assert.equal(adminLoginRes.status, 200);
    assert.equal(adminLoginBody.data.role || adminLoginBody.data.user?.role, "admin");
    const adminToken = adminLoginBody.token || adminLoginBody.data.token;

    // Fetch dashboard metrics
    const metricsRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const metricsBody = await metricsRes.json();
    assert.equal(metricsRes.status, 200);
    assert.equal(metricsBody.success, true);
    assert.ok(metricsBody.data.totalProducts >= 5);
    assert.ok(metricsBody.data.totalCategories === 5);
  });

  test("7. Server-authoritative checkout with database price enforcement and order generation", async () => {
    try {
      // Get product from db
      const prodRes = await fetch(`${baseUrl}/api/products`);
      const prodBody = await prodRes.json();
      const product = prodBody.data[0];

      const initialStock = product.stock;

      const checkoutRes = await fetch(`${baseUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInformation: {
            fullName: "Rahim Chowdhury",
            email: "rahim.chowdhury@example.com",
            phone: "01711223344",
          },
          shippingAddress: {
            address: "House 12, Road 4, Banani",
            city: "Dhaka",
            district: "Dhaka",
            postalCode: "1213",
          },
          paymentMethod: "cod",
          items: [
            {
              productId: product._id,
              productSlug: product.slug,
              productName: product.name,
              quantity: 1,
              unitPrice: 999999, // Tampered client price! Server MUST ignore and enforce DB price!
            },
          ],
        }),
      });

      const checkoutBody = await checkoutRes.json();
      assert.equal(checkoutRes.status, 201);
      assert.equal(checkoutBody.success, true);
      assert.ok(checkoutBody.data.orderNumber.startsWith("UPK-"));

      // Expected price must be product's real effective price + VAT + shipping, not the 999999!
      const effectivePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
      assert.equal(checkoutBody.data.items[0].price, effectivePrice);

      // Verify order in database via order API
      const orderRes = await fetch(`${baseUrl}/api/orders/${checkoutBody.data.orderNumber}`);
      const orderBody = await orderRes.json();
      assert.equal(orderRes.status, 200);
      assert.equal(orderBody.data.orderNumber, checkoutBody.data.orderNumber);

      // Verify stock decremented
      const updatedProdRes = await fetch(`${baseUrl}/api/products/${product.slug}`);
      const updatedProdBody = await updatedProdRes.json();
      assert.equal(updatedProdBody.data.product.stock, initialStock - 1);
    } catch (err) {
      console.error("EXACT TEST 7 ERROR:", err);
      throw err;
    }
  });
});
