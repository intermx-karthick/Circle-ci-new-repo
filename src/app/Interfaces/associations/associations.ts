export interface Product {
    _id: string;
    productName: string;
    clientId: Client;
}

export interface Agency {
    _id: string;
    name: string;
    id: string;
}

export interface Client {
    _id: string;
    clientName: string;
    id: string;
}

export interface Accounting {
    _id: string;
    clientId: Client;
}
