import { Site, SiteApiModel } from '../models';

export class SitesMapper {
  public static sitesApiToSites(siteApiModels: SiteApiModel[]): Site[] {
    if (!siteApiModels) {
      return;
    }

    const models: Site[] = siteApiModels.map((siteApiModel: SiteApiModel) => ({
      _id: siteApiModel._id,
      siteName: siteApiModel.siteName,
      site: siteApiModel.siteName,
      logo: siteApiModel.logo,
      clientId: siteApiModel.clientId,
      accountOwner: siteApiModel.accountOwner,
      ownerEmail: siteApiModel.ownerEmail,
      siteUrl: siteApiModel.siteUrl || siteApiModel.homepage, // ?
      status: siteApiModel.status,
      acAdministrator: siteApiModel.acAdministrator,
      administratorEmail: siteApiModel.administratorEmail,
      createdAt: siteApiModel.createdAt,
      retiredDate: siteApiModel.retiredDate ?? '',
      auth0: siteApiModel.auth0,
      url: siteApiModel.url,
      organizationId: siteApiModel.organizationId,
      auth0Connections: siteApiModel.auth0Connections
    }));

    return models;
  }
}
