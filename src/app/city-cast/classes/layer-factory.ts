export enum MapBoxSourceType {
    TILE = 'Tile',
    SOURCE = 'Source'
}
export enum CCSourceLayers {
    COUNTY = 'counties',
    TRACT = 'tracts',
    BLOCKGROUP = 'blockgroups',
    LINK = 'links',
    ROUTE = 'routes'
}
export enum CCMapFeatureType {
    COUNTY = 'county',
    TRACT = 'tract',
    BLOCKGROUP = 'blockgroup',
    LINK = 'link',
    ROUTE = 'route',
    NETWORK_LINK = 'network-link',
    NETWORK_ROUTE = 'network-route'
}
export enum CCSidebarMenuType {
    COUNTY = 'county',
    TRACT = 'tract',
    BLOCKGROUP = 'blockgroup',
    LINK = 'link',
    ROUTE = 'route',
    NETWORK_LINK = 'network-link',
    NETWORK_ROUTE = 'network-route',
    SETTING = 'settings',
    SCHEME = 'scheme',
    METRICS = 'metrics',
    SEARCH = 'search',
    EXPLORER = 'explorer',
    NETWORK = 'network',
    ROAD_NETWORK = 'road-network',
    TRANSIT_NETWORK = 'transit-network',
    COUNTY_NETWORK = 'county-network',
    TRACT_NETWORK = 'tract-network',
    BLOCKGROUP_NETWORK = 'blockgroup-network',
    EXPLORER_COMMON_MAP = 'explorer-common-map'
}
export enum CCCastStatuses {
    DRAFT = 'draft',
    RUNNING = 'running',
    PUBLISHED = 'published',
    ARCHIVE = 'archive'
}
export enum CCInputAssetTypes {
    POPULATION = 'populationControls',
    STREET = 'streets',
    TRANSIT = 'transit'
}