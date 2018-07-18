/*!
 * 24/7 Customer, Inc. Confidential, Do Not Distribute. This is an
 * unpublished, proprietary work which is fully protected under
 * copyright law. This code may only be used pursuant to a valid
 * license from 24/7 Customer, Inc.
 */
var _tfsl=_tfsl||{};_tfsl.STAGING_URL="d2j8jkom7xmn9n.cloudfront.net/psp/optus-v3-003/default/v0.2/personalize.js",_tfsl.PRODUCTION_URL="d1af033869koo7.cloudfront.net/psp/optus-v3-003/default/v0.2/personalize.js",_tfsl.CUSTOM_TRACK_URL="optus.app.pub.247-inc.net/psp/optus-v1-001/cpxt.js",_tfsl.COOKIE_NAME="sn.rtpath",_tfsl.j=function(a){var b=a+"=",c=document.cookie.split(";");for(var d=0;d<c.length;d++){var e=c[d];while(e.charAt(0)==" ")e=e.substring(1,e.length);if(e.indexOf(b)==0)return e.substring(b.length,e.length)}return null},_tfsl.getPath=function(){var a=_tfsl.j(_tfsl.COOKIE_NAME);return null!=a?a:_tfsl.PRODUCTION_URL},function(){var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=document.location.protocol+"//"+_tfsl.getPath();var b=document.getElementsByTagName("script")[0];b.parentNode.insertBefore(a,b)}()