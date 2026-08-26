/**
 * Centralized Pricing Engine for FreightProxy.io
 * Single source of truth for volumetric calculations and price breakdowns.
 */

export const PRICING_CONFIG = {
  BASE_PRICE: 25.0,
  RATE_PER_KG: 12.5,
  FRAGILE_FEE: 15.0,
  EXPRESS_FEE: 35.0,
  INSURANCE_FEE: 20.0,
  VOLUMETRIC_DIVISOR: 5000,
  CURRENCY: 'USD',
};

/**
 * Calculates volumetric weight, chargeable weight, and full pricing breakdown.
 *
 * @param {object} params
 * @param {number|string} params.weight - Actual package weight in kg
 * @param {number|string} params.length - Length in cm
 * @param {number|string} params.width - Width in cm
 * @param {number|string} params.height - Height in cm
 * @param {boolean} [params.fragile=false]
 * @param {boolean} [params.express=false]
 * @param {boolean} [params.insured=false]
 * @returns {object} { volumetricWeight, chargeableWeight, pricing: { basePrice, weightFee, fragileFee, expressFee, insuranceFee, totalPrice, currency } }
 */
export function calculatePricing({
  weight = 0,
  length = 0,
  width = 0,
  height = 0,
  fragile = false,
  express = false,
  insured = false,
  rates = null,
} = {}) {
  const actualWeight = parseFloat(weight) || 0;
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;

  const divisor = rates?.volumetricDivisor || PRICING_CONFIG.VOLUMETRIC_DIVISOR;
  const vol = (l * w * h) / divisor;
  const chrg = Math.max(actualWeight, vol);

  const basePrice = rates?.basePrice !== undefined ? parseFloat(rates.basePrice) : PRICING_CONFIG.BASE_PRICE;
  const ratePerKg = rates?.pricePerKg !== undefined ? parseFloat(rates.pricePerKg) : PRICING_CONFIG.RATE_PER_KG;
  const fragileFeeVal = rates?.fragileFee !== undefined ? parseFloat(rates.fragileFee) : PRICING_CONFIG.FRAGILE_FEE;
  const expressFeeVal = rates?.expressFee !== undefined ? parseFloat(rates.expressFee) : PRICING_CONFIG.EXPRESS_FEE;
  const insuranceFeeVal = rates?.insurancePercentage ? 20.0 : PRICING_CONFIG.INSURANCE_FEE;

  const weightFee = parseFloat((chrg * ratePerKg).toFixed(2));
  const fragileFee = fragile ? fragileFeeVal : 0.0;
  const expressFee = express ? expressFeeVal : 0.0;
  const insuranceFee = insured ? insuranceFeeVal : 0.0;

  const totalPrice = parseFloat((basePrice + weightFee + fragileFee + expressFee + insuranceFee).toFixed(2));

  return {
    volumetricWeight: parseFloat(vol.toFixed(2)),
    chargeableWeight: parseFloat(chrg.toFixed(2)),
    pricing: {
      basePrice,
      weightFee,
      fragileFee,
      expressFee,
      insuranceFee,
      totalPrice,
      currency: PRICING_CONFIG.CURRENCY,
    },
  };
}
