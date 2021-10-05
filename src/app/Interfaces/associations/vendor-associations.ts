export interface VendorAssociation {
    _id: string;
    name: string;
    id: string;
}

export interface VendorsAssociations {
    vendors: VendorAssociation[];
}
