export class Cast {
  id = '';
  routes_path = '';
  explorer_index_file_routes_path = '';
  tiles_file_routes_paths = [];
  select_explorer_summary_routes_path = '';
  network_analyzer_lines_routes_path = '';
  select_network_analyzer_summary_routes_path = '';
  select_network_analyzer_lines_routes_path = '';
  select_network_analyzer_blockgroups_routes_path = '';
  outputAsset: any;
  mapParameters: any;
  outputAssets: any;
  inputAssets: any;
  status: any;

  scheme_assets_id = '';
  deltas = [];
  unSavedChanges = [];
  parentCast = {};

  setCast(cast) {
    this.initialize();
    this.prepare_cast(cast);
  }
  initialize() {
    this.id = '';
    this.routes_path = '';
    this.status = '';
    this.explorer_index_file_routes_path = '';
    this.tiles_file_routes_paths = [];
    this.select_explorer_summary_routes_path = '';
    this.network_analyzer_lines_routes_path = '';
    this.select_network_analyzer_summary_routes_path = '';
    this.select_network_analyzer_lines_routes_path = '';
    this.select_network_analyzer_blockgroups_routes_path = '';
    this.outputAsset = {};
    this.outputAssets = [];
    this.inputAssets = [];
    
    this.scheme_assets_id = '';
    this.deltas = [];
    this.unSavedChanges = [];
    this.parentCast = {};
  }
  prepare_cast(cast) {
    this.outputAssets = cast.outputAssets;
    this.inputAssets = cast.inputAssets;
    this.id = cast['id'];
    this.status = cast['status'];
    this.mapParameters = cast['mapParameters'];
    const formattedAsset = this.getFormattedAsset();
    this.routes_path =
      (formattedAsset['tiles'] && formattedAsset['tiles']['base']) || [];
    this.tiles_file_routes_paths =
      (formattedAsset['tiles'] && formattedAsset['tiles']['value']) || [];
    this.explorer_index_file_routes_path =
      (formattedAsset['index'] && formattedAsset['index']['value'][0]) || [];
    this.select_explorer_summary_routes_path =
      (formattedAsset['scheme_explorer'] &&
        formattedAsset['scheme_explorer']['value'][0]) ||
      [];
    this.network_analyzer_lines_routes_path =
      (formattedAsset['network_analyzer'] &&
        formattedAsset['network_analyzer']['value'][0]) ||
      [];
    this.select_network_analyzer_summary_routes_path =
      (formattedAsset['network_analyzer'] &&
        formattedAsset['network_analyzer']['value'][1]) ||
      [];
    this.select_network_analyzer_lines_routes_path =
      (formattedAsset['network_analyzer'] &&
        formattedAsset['network_analyzer']['value'][2]) ||
      [];
    this.select_network_analyzer_blockgroups_routes_path =
      (formattedAsset['network_analyzer'] &&
        formattedAsset['network_analyzer']['value'][3]) ||
      [];
  }
  getFormattedAsset() {
    const result = {};
    this.outputAssets.forEach((data) => {
      result[data.assetType] = { base: '', value: [] };
      const basePath =
        data['asset']['basePath'] +
        (data['asset']['basePath'].charAt(
          data['asset']['basePath'].length - 1
        ) !== '/'
          ? '/'
          : '');
      result[data.assetType]['base'] = data['asset']['basePath'];
      data['asset']['files'].forEach((as) => {
        result[data.assetType]['value'].push(basePath + as['file']);
      });
    });
    return result;
  }
}
