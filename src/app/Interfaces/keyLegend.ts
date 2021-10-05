export interface KeyLegend {
    icons: KeyLegendIcon[];
    displayName: string;
    type?: string;
}

export interface KeyLegendIcon {
    type: string;
    color: string;
    font: string;
}
