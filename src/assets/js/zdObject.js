let hostname = window.location.hostname;
if(hostname == "gp.intermx.io" || hostname == "geopath.intermx.com"  || hostname == "www.geopath.io" || hostname == "gisdev.geopath.io")
{
  window.zEmbed||function(e,t){var n,o,d,i,s,a=[],r=document.createElement("iframe");window.zEmbed=function(){a.push(arguments)},window.zE=window.zE||window.zEmbed,r.src="javascript:false",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="display: none",d=document.getElementsByTagName("script"),d=d[d.length-1],d.parentNode.insertBefore(r,d),i=r.contentWindow,s=i.document;try{o=s}catch(e){n=document.domain,r.src='javascript:var d=document.open();d.domain="'+n+'";void(0);',o=s}o.open()._l=function(){var e=this.createElement("script");n&&(this.domain=n),e.id="js-iframe-async",e.src="https://assets.zendesk.com/embeddable_framework/main.js",this.t=+new Date,this.zendeskHost="geopath.zendesk.com",this.zEQueue=a,this.body.appendChild(e)},o.write('<body onload="document._l();">'),o.close()}();
}
else if(hostname == "dev.commb.io" || hostname == "www.commb.io"  || hostname == "cis.commb.io"){
  window.zEmbed||function(e,t){var n,o,d,i,s,a=[],r=document.createElement("iframe");window.zEmbed=function(){a.push(arguments)},window.zE=window.zE||window.zEmbed,r.src="javascript:false",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="display: none",d=document.getElementsByTagName("script"),d=d[d.length-1],d.parentNode.insertBefore(r,d),i=r.contentWindow,s=i.document;try{o=s}catch(e){n=document.domain,r.src='javascript:var d=document.open();d.domain="'+n+'";void(0);',o=s}o.open()._l=function(){var e=this.createElement("script");n&&(this.domain=n),e.id="js-iframe-async",e.src="https://assets.zendesk.com/embeddable_framework/main.js",this.t=+new Date,this.zendeskHost="commb.zendesk.com",this.zEQueue=a,this.body.appendChild(e)},o.write('<body onload="document._l();">'),o.close()}();
}
else if(hostname == "dev.oneomg.io" || hostname == "www.oneomg.io"  || hostname == "staging.oneomg.io" || hostname == "loci.oneomg.io" || hostname === "omg.intermx.com"){
  window.zEmbed||function(e,t){var n,o,d,i,s,a=[],r=document.createElement("iframe");window.zEmbed=function(){a.push(arguments)},window.zE=window.zE||window.zEmbed,r.src="javascript:false",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="display: none",d=document.getElementsByTagName("script"),d=d[d.length-1],d.parentNode.insertBefore(r,d),i=r.contentWindow,s=i.document;try{o=s}catch(e){n=document.domain,r.src='javascript:var d=document.open();d.domain="'+n+'";void(0);',o=s}o.open()._l=function(){var e=this.createElement("script");n&&(this.domain=n),e.id="js-iframe-async",e.src="https://assets.zendesk.com/embeddable_framework/main.js",this.t=+new Date,this.zendeskHost="oneomg.zendesk.com",this.zEQueue=a,this.body.appendChild(e)},o.write('<body onload="document._l();">'),o.close()}();
}
else
{
  window.zEmbed||function(e,t){var n,o,d,i,s,a=[],r=document.createElement("iframe");window.zEmbed=function(){a.push(arguments)},window.zE=window.zE||window.zEmbed,r.src="javascript:false",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="display: none",d=document.getElementsByTagName("script"),d=d[d.length-1],d.parentNode.insertBefore(r,d),i=r.contentWindow,s=i.document;try{o=s}catch(e){n=document.domain,r.src='javascript:var d=document.open();d.domain="'+n+'";void(0);',o=s}o.open()._l=function(){var e=this.createElement("script");n&&(this.domain=n),e.id="js-iframe-async",e.src="https://assets.zendesk.com/embeddable_framework/main.js",this.t=+new Date,this.zendeskHost="intermx.zendesk.com",this.zEQueue=a,this.body.appendChild(e)},o.write('<body onload="document._l();">'),o.close()}();
}


var zdObject = (function() {
  window.zESettings = {
    webWidget: {
      position: { horizontal: 'left', vertical: 'bottom' }
    }
  };
  return {
    createIdentify: function(email,details) {
      //FS.identify(email,details);
      //zE.identify({name: details['displayName'], email: email});
      var subdomain = window.location.hostname;
      if(subdomain != "localhost")
      {
        zE( function () {
  				var userName = details['displayName'];
  				var userEmail = email;
  				zE.identify({name: userName, email: userEmail});
          zE.hide();
         });
        zE('webWidget:on', 'close', function() {
          zE.hide();
        });
      }
    },
    destroyIdentify: function() {
      var subdomain = window.location.hostname;
      if(subdomain != "localhost")
      {
        zE( function () {
  				var userName = '';
  				var userEmail = '';
          zE.identify({name: userName, email: userEmail});
          zE.show();
        });
        zE('webWidget:on', 'close', function() {
          zE.show();
        });
      }
    },
    open: function() {
      var subdomain = window.location.hostname;
      var modules = localStorage.getItem('module_access');
      var help = {};
      if(modules != null)
      {
        module_access = JSON.parse(modules);
        help = module_access['help'];
      }
      if(subdomain != "localhost")
      {
        if(help['status'] && help.status == "active")
        {
          zE( function () {
            zE.activate();
          });
          return true;
        }
        else
        {
          return false;
        }
      }

    }
  }
})(zdObject||{})
