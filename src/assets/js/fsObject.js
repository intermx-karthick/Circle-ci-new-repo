var fsObject = (function() {
  return {
    createIdentify: function(email,details) {
      	FS.identify(email,details);
        FS.setUserVars(email,details);
    },
    destroyIdentify: function() {
      	FS.identify(false);
    },
    mapBoxNotSupported: function() {
      FS.log('error',"mapBoxNotsupported: Mapbox is not supported in user's browser");
    }
  }
})(fsObject||{});
