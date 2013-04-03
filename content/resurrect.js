var resurrect={

  originalDoc:null,

// // // // // // // // // // // // // // // // // // // // // // // // // // //

  onLoad:function() {
    window.removeEventListener('load', resurrect.onLoad, false);

    document.getElementById('contentAreaContextMenu')
        .addEventListener('popupshowing', resurrect.toggleContextItems, false);

    window.document.getElementById('appcontent').addEventListener(
        'DOMContentLoaded', resurrect.contentDomLoad, false);
  },

  toggleContextItems:function(event) {
    resurrect.clickTarget=event.target;

    var onDocument=!(
        gContextMenu.isContentSelected || gContextMenu.onTextInput ||
        gContextMenu.onLink || gContextMenu.onImage);

    document.getElementById('resurrect-page-context')
        .setAttribute('hidden', !onDocument);
    document.getElementById('resurrect-link-context')
        .setAttribute('hidden', !gContextMenu.onLink);
  },

  contentDomLoad:function(event) {
    var contentDoc=event.target;

    if (contentDoc.documentURI.match(/^about:neterror/)) {
      // Inject our content...
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'chrome://resurrect/content/netError.xhtml', false);
      xhr.send(null);
      var resurrectFieldset = xhr.responseXML.getElementById('resurrect');
      var newFieldset = contentDoc.adoptNode(resurrectFieldset);
      var container = contentDoc.getElementById('errorPageContainer');
      container.appendChild(newFieldset);
      // ...including the CSS.
      var link = contentDoc.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', 'chrome://resurrect/skin/netError.css');
      link.setAttribute('type', 'text/css');
      link.setAttribute('media', 'all');
      contentDoc.getElementsByTagName('head')[0].appendChild(link);

      // Add the className that enables it, only when appropriate.
      contentDoc.location.href =
        'javascript:if ("nssBadCert" != getErrorCode()) {'
          + 'document.body.className += " resurrect";'
        + '}; void(0)';

      // Add event listener.
      contentDoc.getElementById('resurrect').addEventListener(
          'click', resurrect.clickedHtml, false);
    }
  },

  disableButtons:function(doc) {
    var bs=doc.getElementById('resurrect')
        .getElementsByTagName('xul:button');
    for (var i=0, b=null; b=bs[i]; i++) {
      b.setAttribute('disabled', 'true');
    }
  },

// // // // // // // // // // // // // // // // // // // // // // // // // // //

  page:function(event) {
    var doc=getBrowser().contentWindow.document;
    resurrect.showDialog(doc.location.href);
  },

  link:function(event) {
    var el=document.popupNode;

    try {
      while (el && el.tagName && 'A'!=el.tagName.toUpperCase()) {
        el=el.parentNode;
      }
      resurrect.showDialog(el.href);
    } catch (e) { }
    return null;
  },

// // // // // // // // // // // // // // // // // // // // // // // // // // //

  loadTarget:function() {
    var pref=Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefBranch);
    var target=pref.getCharPref('extensions.resurrect.target');

    document.getElementById('targetGroup').selectedItem=
        document.getElementById(target);
  },

  saveTarget:function(el) {
    var target=document.getElementById('targetGroup').selectedItem.id;

    var pref=Components.classes['@mozilla.org/preferences-service;1']
        .getService(Components.interfaces.nsIPrefBranch);
    pref.setCharPref('extensions.resurrect.target', target);
  },

// // // // // // // // // // // // // // // // // // // // // // // // // // //

  showDialog:function(url) {
    resurrect.originalDoc=getBrowser().contentWindow.document;

    window.openDialog(
        'chrome://resurrect/content/resurrect-select-mirror.xul',
        '_blank',
        'modal,centerscreen,resizable=no,chrome,dependent',
        getBrowser().contentWindow.document, url);
  },

  clickedHtml:function(event) {
    if ('true'==event.target.getAttribute('disabled')) {
      return;
    }
    return resurrect.clickHandler(
        event,
        event.target.ownerDocument,
        event.target.ownerDocument.location.href);
  },
  clickedXul:function(event) {
    resurrect.saveTarget(event.target);

    return resurrect.clickHandler(
        event,
        window.arguments[0],
        window.arguments[1]);
  },
  clickHandler:function(event, contentDoc, rawUrl) {
    resurrect.disableButtons(event.target.ownerDocument);

    // Run the actual code. After timeout for UI repaint.
    setTimeout(
        resurrect.selectMirror, 1,
        'archive',
        event.target.ownerDocument,
        contentDoc, rawUrl);
  },

  selectMirror:function(mirror, ownerDoc, contentDoc, rawUrl) {
    var encUrl=encodeURIComponent(rawUrl);
    var gotoUrl='http://wayback.archive.org/web/*/'+rawUrl;

    if (ownerDoc.getElementById('targetTab').getAttribute('selected')) {
      window.opener.openUILinkIn(gotoUrl, 'tab');
    } else {
          contentDoc.location.assign(gotoUrl);
    }

    if ('chrome://resurrect/content/resurrect-select-mirror.xul'==window.document.location) {
      // setTimeout avoids errors because the window is gone
      setTimeout(window.close, 0);
    }
  }
};
