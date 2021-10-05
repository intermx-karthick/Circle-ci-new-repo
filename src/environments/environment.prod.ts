export const environment = {
  production: true,
  version: '0.8.86',
  siteName : "Geopath",
  API_URL: "https://api.intermx.com/",
  API_KEY: "xkXuquCWY6J32fVLtQX3SUelvbwjrzDo",
  API_APIGEE_URL_V1: "https://intermx-prod.apigee.net/v1/",
	API_PLACES_URL_V2: "https://intermx-test.apigee.net/dev/v2/",
  mapbox: {
  	access_token : "pk.eyJ1IjoiaW50ZXJteCIsImEiOiJjajJqOWM4eW4wMDRwMndteDZqZ2tzaGoxIn0.xD-vjv6mH8eYZkb_luz8ag",
  	style:"mapbox://styles/intermx/cj2qj1kf8003k2rmr4dz8mzn0",
  	new_style:'mapbox://styles/intermx/cjd6t1epr350e2sp8h6tf5ij2',
  	new_satellite_style:'mapbox://styles/intermx/cjo8btwwg03882spkvkdmz4la'
  },
  themeSettings:{
  	domain:'gp.intermx.io,geopath.intermx.com,gisdev.geopath.io,www.geopath.io,dev.commb.io,cis.commb.io,www.commb.io,lm.intermx.io,lamar.intermx.com,lisdev.intermx.com,omg.intermx.io,dev.oneomg.io,www.oneomg.io,mm.intermx.io, dev.macdonaldmedia.io, www.macdonaldmedia.io, ideas.macdonaldmedia.io,dev.acvb.io,staging.acvb.io,acvb.io,ads.intermx.io,adsdev.geopath.org,adsbridge.geopath.org',
		color : {
			primary :'#008da4',
			secondary :'#1eb8ab',
			highlight :'#fcbd32',
			button : '#922a95'
		},
		color_sets : {
			error: { '300' : '#FAF0F4', '600': '#EFCCDA', '900': '#B00048', 'base': '#B00048'},
			gray: { '050' : '#FAFAFA', '100': '#F5F5F5', '200': '#EEEEEE', '300': '#E0E0E0', '400': '#BDBDBD', '500': '#9E9E9E'
			, '600': '#757575', '700': '#616161' , '800': '#424242' , '900': '#212121', 'base': '#212121'},
			highlight: { 'base': '#FCBD32'},
			primary: {
			   '050' : '#F3E5F2',
			   '100' : '#E2BEE0',
			   '200' : '#D094CD',
			   '300' : '#BD6AB8',
			   '400' : '#AE4BA9',
			   '500' : '#9F2E9B',
			   '600' : '#922A95',
			   '700' : '#81248D',
			   '800' : '#711F84',
			   '900' : '#551875',
			   'base' : '#922A95'
			},
			secondary: {
			   '050' : '#E1F9FB',
			   '100' : '#B4EFF4',
			   '200' : '#83E4EE',
			   '300' : '#51D9E7',
			   '400' : '#29D0E1',
			   '500' : '#00C7DD',
			   '600' : '#00B7C9',
			   '700' : '#00A1AF',
			   '800' : '#008D97',
			   '900' : '#00696C',
			   'base' : '#008D97'
			},
			success: {'300': 'F0FCF8', '600': 'CDF5E8', '900': '#05D08C', 'base': '#05D08C'},
			warning: {'300': 'FFF7F5', '600': 'FFE6DD', '900': '#FF8256', 'base': '#FF8256'}
		},
		logo : {
  			full_logo :'/assets/images/geopath_black_logo.png',
  			mini_logo :'/assets/images/geo_path_mini_logo.png'
  	},
		background :{
			bg_image :'/assets/images/login-page-background.jpg',
			bg_color :'#922a95'
		},
		customize : {
			favicon_logo :'/assets/images/geo_path_mini_logo.png'
		},
		productName : "Insights Suite",
    welcome : "If you are part of our early access program, sign in below.",
    homepage : "http://www.geopath.org"
  },
  themeSettings1:{
  	domain:'wow.intermx.io,app.intermx.com',
		color : {
			primary :'#0096D6',
			secondary :'#F04E26',
			highlight :'#8FCC8D',
			button : '#FC3868'
		},
		logo : {
  			full_logo :'/assets/images/theme2/logo.png',
  			mini_logo :'/assets/images/theme2/mini_logo.svg'
  	},
		background :{
			bg_image :'/assets/images/theme2/login_bg.jpg',
			bg_color :'#922a95'
		},
		customize : {
			favicon_logo :'/assets/images/theme2/mini_logo.png'
		},
		productName : "Insights Suite",
    welcome : "If you are part of our early access program, sign in below.",
    homepage : "http://www.geopath.org"
  },
  imageValidation:{
  	bg_image :{
			width :1024,
			height :768
		},
		full_logo :{
			width :200,
			height :50
		},
		mini_logo :{
			width :50,
			height :50
		},
		favicon_logo :{
			width :30,
			height :30
		}
	},
	fontMarker : {
		'lens': 'r',
		'place': 'k',
		'icon-circle-stroke': 'A',
		'icon-map-pin': 'B',
		'icon-wink-flat': 'a',
		'icon-wink-flat-dig': 'b',
		'icon-wink-pb': 'c',
		'icon-wink-pb-dig': 'd',
		'icon-wink-round': 'e',
		'icon-wink-round-dig': 'f',
		'icon-wink-square': 'g',
		'icon-wink-square-dig': 'h',
		'icon-place': 'i',
		'icon-star1': 'j',
		'icon-map-marker': 'k',
		'icon-street-view': 'l',
		'icon-map-signs': 'm',
		'icon-map-o': 'n',
		'icon-map': 'o',
		'icon-globe': 'p',
		'icon-location-arrow': 'q',
		'icon-circle': 'r',
		'icon-square': 's',
		'icon-triangle': 't',
		'icon-square-1': 'u',
		'icon-thumb-tack': 'v',
		'icon-bullseye': 'w',
		'icon-circle-o': 'x',
		'icon-circle-1': 'y',
		'icon-neuter': 'z',
		'icon-bank': '\e900;'
	},

	sitesData: [
		{
			"site" : "geopath",
			"siteName" : "Geopath",
			"domains" : ["https://www.geopath.io", "https://insights.geopath.org", "https://geopath.intermx.com",
				"https://gisdev.geopath.io", "https://geopath.staging.intermx.io", "https://gp.intermx.io", "https://geopath.integration.intermx.io",
				"http://geopath.development.intermx.io:8003"],
			"title" : "Geopath Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "If you are a Geopath member, sign in below.",
			"homepage" : "http://www.geopath.org",
			"baseColor": "#922A95",
			"logo" : "/assets/images/geopath_black_logo.png"
		},
		{
			"site" : "commb",
			"siteName" : "COMMB",
			"domains" : ["https://www.commb.io", "https://commb.intermx.com", "https://www.commb.io", "https://commb.intermx.com",
				"https://cis.commb.io", "https://commb.staging.intermx.io", "https://dev.commb.io", "https://commb.integration.intermx.io"],
			"title" : "Commb Navigator Plus",
			"productName" : "Navigator Plus",
			"welcome" : "If you are part of our early access program, sign in below.",
			"homepage" : "http://www.commb.ca",
			"baseColor": "#ED1C24",
			"logo" : "/assets/images/commb_logo.png"
		},
		{
			"site" : "lamar",
			"siteName" : "Lamar",
			"domains": ["https://lamar.intermx.com", "https://lisdev.intermx.com", "https://lamar.staging.intermx.io",
				"https://lm.intermx.io", "https://lamar.integration.intermx.io"],
			"title" : "Lamar Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "http://www.lamar.com",
			"baseColor": "#115740",
			"logo" : "/assets/images/lamar_logo.png"
		},
		{
			"site" : "omg",
			"siteName" : "OMG",
			"domains" : ["https://www.oneomg.io", "https://loci.oneomg.io", "https://omg.intermx.com", "https://support.oneomg.io", "https://ideas.oneomg.io",
				"https://staging.oneomg.io", "https://omg.staging.intermx.io", "https://omg.intermx.io", "https://dev.oneomg.io", "https://omg.integration.intermx.io"],
			"title" : "OMG Insights Suite",
			"productName" : "Location Powered Planning",
			"welcome" : "Sign in below.",
			"homepage" : "https://www.outdoormediagroup.net",
			"baseColor": "#2392D4",
			"logo" : "/assets/images/omg_logo.png"
		},
		{
			"site" : "macdonald",
			"siteName" : "Macdonald",
			"domains":["https://www.macdonaldmedia.io", "https://macdonaldmedia.intermx.com", "https://ideas.macdonaldmedia.io",
				"https://dev.macdonaldmedia.io", "https://staging.macdonaldmedia.io", "https://macdonaldmedia.staging.intermx.io",
				"https://mm.intermx.io", "https://macdonaldmedia.integration.intermx.io"],
			"title" : "Macdonald Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "https://www.macdonaldmedia.com",
			"baseColor" : "#4276BB",
			"logo" : "/assets/images/macdonald_logo.png"
		},
		{
			"site" : "acvb",
			"siteName" : "ACVB",
			"domains":["https://www.acvb.io", "https://acvb.intermx.com", "https://tourism.ideas.aha.io",
				"https://staging.acvb.io", "https://acvb.staging.intermx.io", "https://dev.acvb.io", "https://acvb.integration.intermx.io"],
			"title" : "ACVB Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "https://www.atlanta.net/",
			"baseColor" : "#CF202F",
			"logo" : "/assets/images/acvb_logo.png"
		},
		{
			"site" : "ads",
			"siteName" : "ADS",
			"domains":["https://adsbridge.geopath.org", "https://ads.intermx.com", "https://adsdev.geopath.org", "https://ads.geopath.io", "https://ads.staging.intermx.io",
				"https://ads.intermx.io", "https://ads.integration.intermx.io"],
			"title" : "ADS Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "http://www.geopath.org",
			"baseColor" : "#6B5430",
			"logo" : "/assets/images/ads_logo.png"
		},
		{
			"site" : "intermx",
			"siteName" : "INTERMX",
			"domains": ["https://app.intermx.com", "https://staging.intermx.com", "https://staging.intermx.io",
				"https://wow.intermx.io", "https://dev.intermx.com", "https://integration.intermx.io",
				"http://lbd.intermx.io:8003", "http://lbi.intermx.io:8003"],
			"title" : "Intermx Insights Suite",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "http://www.intermx.com",
			"baseColor" : "#0D96D4",
			"logo" : "/assets/images/theme2/logo.png"
		},
		{
			"site" : "ooh",
			"siteName" : "OOH",
			"domains": ["https://ooh.intermx.com", "https://ooh.staging.intermx.io", "https://ooh.integration.intermx.io"],
			"title" : "Intermx OOH Platform",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "http://www.intermx.com/",
			"baseColor" : "#0D96D4",
			"logo" : "/assets/images/theme2/logo.png"
		},
		{   "site" : "travel",
			"siteName" : "Travel",
			"domains": ["https://travel.intermx.com", "https://travel.staging.intermx.io", "https://travel.integration.intermx.io"],
			"title" : "Intermx Visitation Platform",
			"productName" : "Insights Suite",
			"welcome" : "Sign in below.",
			"homepage" : "http://www.intermx.com",
			"baseColor" : "#0D96D4",
			"logo" : "/assets/images/theme2/logo.png"
		}
	],
  devops: {
    image_version: "2021.9.1452",
  	image_rc: 1
  }
};
