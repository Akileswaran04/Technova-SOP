/**
 * TECHNOVA type definitions.
 *
 * Since this is a JS project (not TypeScript), these serve as
 * documentation for the shape of objects used across the app.
 * Convert to .ts when migrating to TypeScript.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {'seller'|'buyer'|'admin'} role
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} SellerProfile
 * @property {string} id
 * @property {string} user_id
 * @property {string} business_name
 * @property {string} business_type
 * @property {string} description
 * @property {string} phone
 * @property {string} email
 * @property {string} website
 * @property {string} address_line_1
 * @property {string} address_line_2
 * @property {string} city
 * @property {string} state
 * @property {string} country
 * @property {string} postal_code
 * @property {string} license_number
 * @property {SellerProfileStatus} verification_status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {'DRAFT'|'SUBMITTED'|'UNDER_REVIEW'|'VERIFIED'|'REJECTED'|'SUSPENDED'} SellerProfileStatus
 */

/**
 * @typedef {Object} SellerVerification
 * @property {string} id
 * @property {string} seller_id
 * @property {string} verification_type
 * @property {string} document_reference
 * @property {string} status
 * @property {string} reviewed_by
 * @property {string} reviewed_at
 * @property {string} rejection_reason
 * @property {string} created_at
 * @property {string} updated_at
 */

export default {};
