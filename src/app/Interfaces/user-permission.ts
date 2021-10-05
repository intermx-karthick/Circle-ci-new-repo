export const enum UserRole {
    AGENCIES = 'agency',
    VENDOR_GENERAL = 'vendor_general',
    VENDOR_SHIPPING = 'vendor_shipping',
    CLIENT_GENERAL = 'client_general',
    CLIENT_PRODUCT = 'client_product',
    CLIENT_ESTIMATE = 'client_estimate',
    CLIENT_ACCOUNTING = 'client_accounting',
    CONTACTS = 'contacts',
    ATTACHMENT = 'attachment',
    ORGANIZATIONS = 'organizations',
    PRINT_PRODUCTION = 'print_production',
    GROUPS = 'groups',
    CONTRACT = 'contract',
    BILLING_EXPORTS = 'billing_exports'
}

export interface UserActionPermission {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
}