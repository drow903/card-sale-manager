"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const LICENSE_API = "https://api.lemonsqueezy.com/v1/licenses";

function postForm(action, fields) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(fields).toString();
    const request = https.request(`${LICENSE_API}/${action}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) }
    }, (response) => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { text += chunk; });
      response.on("end", () => {
        let payload = {};
        try { payload = JSON.parse(text || "{}"); } catch {}
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(payload);
        else {
          const error = new Error(payload.error || payload.message || `License service returned status ${response.statusCode}.`);
          error.definitive = response.statusCode >= 400 && response.statusCode < 500;
          reject(error);
        }
      });
    });
    request.setTimeout(15000, () => request.destroy(new Error("License check timed out.")));
    request.on("error", reject);
    request.end(body);
  });
}

class LicenseService {
  constructor({ app, safeStorage, config }) {
    this.app = app;
    this.safeStorage = safeStorage;
    this.config = config;
    this.record = this.readRecord();
  }

  get filePath() { return path.join(this.app.getPath("userData"), "license.json"); }
  get configured() {
    return Number(this.config.storeId) > 0 && Number(this.config.productId) > 0
      && this.config.customerVariantIds.some((value) => Number(value) > 0)
      && this.config.ownerVariantIds.some((value) => Number(value) > 0);
  }

  readRecord() {
    try {
      const envelope = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      if (!this.safeStorage.isEncryptionAvailable() || !envelope.encrypted) return null;
      return JSON.parse(this.safeStorage.decryptString(Buffer.from(envelope.encrypted, "base64")));
    } catch { return null; }
  }

  async writeRecord(record) {
    if (!this.safeStorage.isEncryptionAvailable()) throw new Error("Windows credential encryption is not available on this computer.");
    const target = this.filePath;
    const temporary = `${target}.tmp`;
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    const encrypted = this.safeStorage.encryptString(JSON.stringify(record)).toString("base64");
    await fs.promises.writeFile(temporary, JSON.stringify({ encrypted }), "utf8");
    await fs.promises.rename(temporary, target);
    this.record = record;
  }

  classify(meta = {}) {
    const storeId = Number(meta.store_id || meta.storeId || 0);
    const productId = Number(meta.product_id || meta.productId || 0);
    const variantId = Number(meta.variant_id || meta.variantId || 0);
    if (storeId !== Number(this.config.storeId)) return "invalid";
    const configuredOwnerProducts = (this.config.ownerProductIds || []).map(Number).filter((value) => value > 0);
    const ownerProducts = configuredOwnerProducts.length ? configuredOwnerProducts : [Number(this.config.productId)];
    if (ownerProducts.includes(productId) && this.config.ownerVariantIds.map(Number).includes(variantId)) return "owner";
    if (productId === Number(this.config.productId) && this.config.customerVariantIds.map(Number).includes(variantId)) return "customer";
    return "invalid";
  }

  publicStatus(message = "") {
    const record = this.record || {};
    const now = Date.now();
    const verifiedAt = Date.parse(record.verifiedAt || "");
    const lastSeenAt = Date.parse(record.lastSeenAt || "");
    const expiresAt = Date.parse(record.expiresAt || "");
    const offlineUntil = Number.isFinite(verifiedAt) ? verifiedAt + Number(this.config.offlineDays || 30) * 86400000 : 0;
    const clockValid = !Number.isFinite(lastSeenAt) || now + 300000 >= lastSeenAt;
    const expiryValid = !Number.isFinite(expiresAt) || now < expiresAt;
    const locallyValid = Boolean(!record.suspended && record.licenseKey && record.instanceId && ["customer", "owner"].includes(record.entitlement) && now <= offlineUntil && clockValid && expiryValid);
    return {
      enabled: this.config.enabled !== false,
      configured: this.configured,
      licensed: locallyValid,
      entitlement: locallyValid ? record.entitlement : "none",
      owner: locallyValid && record.entitlement === "owner",
      catalogVisible: locallyValid && record.entitlement === "owner" && record.catalogVisible === true,
      checkoutUrl: this.config.checkoutUrl || "",
      lastVerifiedAt: record.verifiedAt || "",
      offlineUntil: offlineUntil ? new Date(offlineUntil).toISOString() : "",
      maskedKey: record.licenseKey ? `••••-${String(record.licenseKey).slice(-4)}` : "",
      message
    };
  }

  validateIdentity(payload, { allowInactive = false } = {}) {
    const reject = (message) => { const error = new Error(message); error.definitive = true; throw error; };
    const entitlement = this.classify(payload.meta || {});
    if (entitlement === "invalid") reject("That license belongs to a different product or edition.");
    if (payload.meta?.test_mode) reject("Test-mode licenses are not accepted by this build.");
    if (payload.valid === false) reject(payload.error || "This license is not valid.");
    const status = String(payload.license_key?.status || "active").toLowerCase();
    if (status !== "active" && !(allowInactive && status === "inactive")) reject(`This license is ${status}.`);
    const expiresAt = payload.license_key?.expires_at;
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) reject("This license has expired.");
    return entitlement;
  }

  async activate(rawKey) {
    if (!this.configured) throw new Error("CSM licensing still needs its Lemon Squeezy product and variant IDs.");
    const licenseKey = String(rawKey || "").trim();
    if (!licenseKey) throw new Error("Enter a license key.");
    if (this.record?.licenseKey === licenseKey && this.record?.instanceId) return this.refresh(true);
    const eligibility = await postForm("validate", { license_key: licenseKey });
    this.validateIdentity(eligibility, { allowInactive: true });
    const payload = await postForm("activate", { license_key: licenseKey, instance_name: `CSM on ${require("os").hostname()}` });
    const entitlement = this.validateIdentity(payload);
    if (!payload.instance?.id) throw new Error("The license service did not return an activation ID.");
    const now = new Date().toISOString();
    await this.writeRecord({ licenseKey, instanceId: payload.instance.id, entitlement, verifiedAt: now, lastSeenAt: now, expiresAt: payload.license_key?.expires_at || "", suspended: false, catalogVisible: false });
    return this.publicStatus("License activated.");
  }

  async refresh(requireOnline = false) {
    if (!this.record?.licenseKey || !this.record?.instanceId) return this.publicStatus("Enter your license key to activate CSM.");
    try {
      const payload = await postForm("validate", { license_key: this.record.licenseKey, instance_id: this.record.instanceId });
      const entitlement = this.validateIdentity(payload);
      const now = new Date().toISOString();
      await this.writeRecord({ ...this.record, entitlement, verifiedAt: now, lastSeenAt: now, expiresAt: payload.license_key?.expires_at || this.record.expiresAt || "", suspended: false });
      return this.publicStatus("License verified.");
    } catch (error) {
      if (error.definitive) {
        await this.writeRecord({ ...this.record, suspended: true, lastSeenAt: new Date().toISOString() });
        return this.publicStatus(error.message || "This license is no longer valid.");
      }
      const status = this.publicStatus(error.message || "Could not verify the license online.");
      if (!requireOnline && status.licensed) {
        await this.writeRecord({ ...this.record, lastSeenAt: new Date().toISOString() });
        return { ...this.publicStatus(), message: "Offline license grace period is active." };
      }
      if (requireOnline) throw error;
      return status;
    }
  }

  async deactivate() {
    if (this.record?.licenseKey && this.record?.instanceId) {
      await postForm("deactivate", { license_key: this.record.licenseKey, instance_id: this.record.instanceId });
    }
    try { await fs.promises.unlink(this.filePath); } catch (error) { if (error.code !== "ENOENT") throw error; }
    this.record = null;
    return this.publicStatus("License deactivated on this computer.");
  }

  async revealCatalog() {
    const status = await this.refresh(true);
    if (!status.owner) throw new Error("This feature requires the private CSM owner edition.");
    await this.writeRecord({ ...this.record, catalogVisible: true });
    return this.publicStatus("Owner tools unlocked.");
  }

  async hideCatalog() {
    if (this.record) await this.writeRecord({ ...this.record, catalogVisible: false });
    return this.publicStatus("Owner tools hidden.");
  }

  catalogAllowed() { return this.publicStatus().catalogVisible; }
}

module.exports = { LicenseService };
