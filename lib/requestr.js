/*
 * TODO (jam@):
 * + IMPORTANT: Backend API should accept and relay user-agent when requesting page!
 * + Build caching functionality
 * + Add HTML fragment parser
 * + Add recursive CSS parsing on server-side
 * + Allow user define element node names and attributes for parsing (also disable)
 * + Add parsing for inline styles
 * + Finalize testing spec
 * + Add missing events in new parsing steps
 * + Add recursion for CSS imports
 * + Improve logic for load event to be redispatched to include unresolved elements
 * + Add central error thrower
 */
if (typeof window !== 'undefined') {
  // Checking for Requestr to prevent reinit.
  if (!window.Requestr) {
    // Polyfill for CustomEvent if not supported by browser (IE).
    (function() {
      function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      }
      if (window.CustomEvent) {
        CustomEvent.prototype = window.CustomEvent.prototype;
      }
      window.CustomEvent = CustomEvent;
    })();
    // Initializing Requestr.
    (function() {
      'use strict';
      // Standarizing for easy nomalization removal.
      window.URL = window.URL || window.webkitURL;
      // Add Requestr as a global, might be optinal depending on mode.
      var Requestr = window.Requestr = {};
      // The class attribute added to the documentElement while loading.
      Requestr.LOADING_CLASS = 'requestr';
      // The query selector string to use to find elements.
      Requestr.ELEMENTS_QUERY = '[rel~="stylesheet"][href], [rel~="icon"][href], [src]';
      // The query selector string to find serialization element.
      Requestr.SERIALIZATION_QUERY = 'script[type="text/requestr-serialization"]';
      // The attribute used to indicate the element loading Requestr.
      Requestr.JS_ELEMENT_ATTRIBUTE = 'data-requestr-js';
      // Default file size for files to be converted to URIs in bytes.
      Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE = 40000;
      // Getting the serialization elements if specified in document.
      Requestr.serialization = document.querySelector(Requestr.SERIALIZATION_QUERY);
      // User define event callback handler (might change to be dispatch).
      Requestr.onEvent = null;
      // List of node names allowed to be parsed.
      Requestr.urlParsingEnabledElement = {
        'IMG': true,
        'LINK': true,
        'SCRIPT': true
      };
      // Stores the already resolved URLs.
      Requestr.resolvedUrls = [];
      // Third party code used by Requestr.
      Requestr.thirdParty = {};
      /**
       * Custom events dispatched by Requestr.
       * @enum {string}
       */
      Requestr.customEvents = {
        // Requestr events.
        REQUESTR_READY: 'requestrReady',
        // Requestr document events.
        DOCUMENT_LOAD_START: 'documentLoadStart',
        DOCUMENT_LOAD_PROGRESS: 'documentLoadProgress',
        DOCUMENT_LOAD_ERROR: 'documentLoadError',
        DOCUMENT_LOAD_COMPLETE: 'documentLoadComplete',
        DOCUMENT_RENDERED: 'documentRendered',
        DOCUMENT_BLOB_URL_CREATED: 'documentBlobUrlCreated',
        // Requestr resource API events.
        RESOURCE_API_ERROR: 'resourceApiError',
        RESOURCE_LOAD_START: 'resourceLoadStart',
        RESOURCE_LOAD_PROGRESS: 'resourceLoadProgress',
        RESOURCE_LOAD_ERROR: 'resourceLoadError',
        RESOURCE_LOAD_COMPLETE: 'resourceLoadComplete',
        RESOURCE_RESOLVING: 'resourceResolving',
        // Requestr CSS parsing events.
        EXTERNAL_CSS_LOAD_START: 'externalCssLoadStart',
        EXTERNAL_CSS_LOAD_COMPLETE: 'externalCssLoadComplete',
        EXTERNAL_CSS_LOAD_PROGRESS: 'externalCssLoadProgress',
        EXTERNAL_CSS_LOAD_ERROR: 'externalCssLoadError'
      };
      /**
       * Make callback with custom events Requestr to defined method.
       * @param {string} evt The custom event to dispath by via Requestr.
       * @param {Object=} data Optional event data set is customData property.
       */
      Requestr.dispatchCustomEvent = function(evt, data) {
        // Checking for function to be defined.
        if (typeof Requestr.onEvent === 'function') {
          // Making CustomEvent callback handler.
          Requestr.onEvent((data ? (new CustomEvent(evt, {'detail': data})) : (new CustomEvent(evt))));
        }
      };
      /**
       * Prevents the window from continuing to load any HTTP
       * requests, including window documnent itself.
       */
      Requestr.stopWindow = function() {
        /*
         * Preventing the window from loading anything, this cuts off
         * loading requests and the remainder of the document. The goal
         * here is to let Requestr handle the parsing and requests
         * before the browser. Only content loaded prior to Requestr
         * on the DOM will work, including JavaScript. All handlers for
         * loading events should be done before Requestr, and so should
         * be any DOM and CSS needed for the loading/preloading feedback.
         */
        if (window.stop) {
          window.stop();
        } else {
          // TODO (jam@): Test in IE, this is just a prototype.
          document.execCommand('Stop');
        }
      };
      /**
       * Parses the Requestr serialization data, and determines any init steps to take.
       * @param {HTMLElement} serializationEl The element containing the serialization JSON data.
       */
      Requestr.parseSerialization = function(serializationEl) {
        // Parsing serialization data from document if specified.
        if (serializationEl && (serializationEl.textContent || serializationEl.innerText)) {
          serializationEl = JSON.parse((serializationEl.textContent || serializationEl.innerText));
          // Storing serialization data.
          Requestr.serialization = serializationEl;
          // Getting the location of the dataURI service.
          if (serializationEl && serializationEl.service) {
            // TODO (jam@): Add the capability of doing multiple services (per domain).
            Requestr.service = serializationEl.service;
          } else {
            // TODO (jam@): Add error handling for no service specificed.
          }
          // Dispatching Requestr ready event.
          window.dispatchEvent(new CustomEvent(Requestr.customEvents.REQUESTR_READY));
          // Checking for page to load or self.
          if (serializationEl && serializationEl.self) {
            // Loading self.
            Requestr.loadPage(window.location.href);
          } else if (serializationEl && serializationEl.owner) {
            // Loading external page.
            Requestr.loadPage(serializationEl.owner);
          } else {
            // TODO (jam@): This means they want to load iframes or fragments.
          }
        } else {
          // TODO (jam@): Throw an error since a service is required for
          // any optimization to really work.
        }
      };
      /**
       * Loads a page from URL provided and parses assets' URLs. If a callback
       * is defined, the page is loaded in memory as a blob URL.
       * @param {string} pageUrl The url of the page to load into main window.
       * @param {Function=} callback The callback to send the blob URL of the
       *     parsed page.
       * @param {Object=} mutator HTML strings to inject into the document
       *     before it is parsed. Consists of head or body with before or
       *     after HTML strings.
       */
      Requestr.loadPage = function(pageUrl, callback, mutator) {
        // Adding class to allow for styling.
        document.documentElement.classList.add(Requestr.LOADING_CLASS);
        // TODO (jam@): Determine best point to stop window.
        Requestr.stopWindow();
        // Dispatching event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_LOAD_START);
        // Using the browser to resolve the URL.
        var url = document.createElement('a');
        url.setAttribute('href', pageUrl);
        url = url.href;
        // Checking to load page according to origin.
        if (url.indexOf(window.location.origin) === 0) {
          // Loading page via XHR for parsing.
          Requestr.xhr = new XMLHttpRequest();
          Requestr.xhr.open('GET', pageUrl, true);
          // If a callback is passed, the document is loaded into memory
          // and callbacks with blob URL, otherwise loads into the current.
          if (callback) {
            Requestr.xhr.blobUrlCallback = callback;
          }
          // Checking for mutator, it will be injected before parsing begins.
          if (mutator) {
            Requestr.xhr.documentMutator = mutator;
          }
          // Handling XHR events for proper feedback.
          Requestr.xhr.addEventListener('load', Requestr.parsePage, true);
          Requestr.xhr.addEventListener('progress', Requestr.pageLoadProgress, true);
          Requestr.xhr.addEventListener('error', Requestr.pageLoadError, true);
          Requestr.xhr.addEventListener('abort', Requestr.pageLoadAbort, true);
          // Getting data a document type to optimize parsing.
          Requestr.xhr.responseType = 'document';
          Requestr.xhr.send();
        } else if (Requestr.service) {
          // Using the Backend API to bypass cross-domain should
          // CORS not be enabled in the server hosting the page.
          Requestr.requestDataUriFromService(Requestr.service, [{
            Url: url,
            Token: null,
            Type: 'STRING'
          }], {
            load: function(e) {
              var resource = e.target.response;
              // If JSON response is not supported by browser.
              if (typeof resource !== 'object') {
                resource = JSON.parse(resource);
              }
              // Checking for proper response from API.
              if (resource && (resource = resource.Resources) && (resource = resource[0])) {
                // Creating in-memory document for URL resolving.
                var base, parser = new DOMParser(), doc,
                    dimp = window.document.implementation.createHTMLDocument('');
                // Setting in-memory document with loaded data.
                doc = parser.parseFromString(resource.Data, 'text/html');
                // TODO (jam@): Figure out why DOMParser is not working on all browsers.
                if (!doc) {
                  // TODO (jam@): Add fallback to copy documentElement attributes.
                  doc = window.document.implementation.createHTMLDocument('');
                  doc.documentElement.innerHTML = resource.Data;
                  console.log('Warning: This browser does not support DOMParser fully, documentElement will not inherit original attributes.');
                }
                // Checking for base element to be present, otherwise need to specify
                // to pass URL resolving to the browser.
                if ((base = doc.getElementsByTagName('base')).length === 0) {
                  base = doc.createElement('base');
                  // Since there isn't a base element, adding one with the determined URL.
                  base.setAttribute('href', url);
                  // TODO (jam@): File bug against Firefox, base element only
                  // resolves requests made after it's occurance in the DOM.
                  doc.head.insertBefore(base, doc.head.firstChild);
                }
                // When resolving on a cross-domain, the DOM Implementation does
                // not resolve CSS urls, so must re-init with base elements added.
                // This could be a bug, since the content should not be loaded, so
                // querying for the value should be resolved according to the
                // base element.
                dimp.documentElement.innerHTML = doc.documentElement.outerHTML;
                // Copying attributes since documentElement is read only.
                Requestr.duplicateElementAttributes(doc.documentElement, dimp.documentElement);
                // TODO (jam@): Perhaps use the same method for relative and cross-domain.
                Requestr.parsePage({target: {response: dimp}}, callback, mutator);
              } else {
                // TODO (jam@): Add error handling.
                console.log('Error: Service API did not return a document!');
                // TODO (jam@): Temporary fix to allow timeouts to resolve.
                callback(null);
              }
            },
            error: callback,
            progress: null,
            abort: callback
            // TODO (jam@): The API should have a wildcard so that all
            // documents are loaded using it no matter file size. Using
            // this as an arbitrary number at the moment.
          }, null, 2000000);
        } else {
          // TODO (jam@): Add error handling or a way to allow CORS page loading.
          console.log('Error: Cannot load page. Page is not relative and no service API was specified.');
        }
      };
      /**
       * Removing listeners after end event.
       */
      Requestr.removePageLoadXhrListeners = function() {
        if (Requestr.xhr) {
          Requestr.xhr.removeEventListener('load', Requestr.parsePage, true);
          Requestr.xhr.removeEventListener('progress', Requestr.pageLoadProgress, true);
          Requestr.xhr.removeEventListener('error', Requestr.pageLoadError, true);
          Requestr.xhr.removeEventListener('abort', Requestr.pageLoadAbort, true);
        }
      };
      /**
       * Dispatches a progress event for the document being loaded.
       * @param {Event} progress The progress event for the XHR of the document.
       */
      Requestr.pageLoadProgress = function(progress) {
        // Dispatching event, including load percentage.
        Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS, {
          progress: Math.round(progress.loaded / progress.totalSize * 100),
          bytes: progress.loaded,
          total: progress.totalSize
        });
      };
      /**
       * Dispatches an error event for the document being loaded.
       * @param {Event} error The error event for the XHR of the document.
       */
      Requestr.pageLoadError = function(error) {
        // Cleaning up listeners to recycle xhr.
        Requestr.removePageLoadXhrListeners();
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {
          error: error
        });
      };
      /**
       * Dispatches an error event for the document being loaded.
       * @param {Event} abort The error event for the XHR of the document.
       */
      Requestr.pageLoadAbort = function(abort) {
        // Cleaning up listeners to recycle xhr.
        Requestr.removePageLoadXhrListeners();
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {
          error: abort
        });
      };
      /**
       * Parses a HTML document fully, as in a page.
       * @param {Event} request The XHR document typed request.
       * @param {Function=} callback Optional callback for when parsing is completed.
       * @param {Object=} mutator HTML strings to inject into the document
       *     before it is parsed. Consists of head or body with before or
       *     after HTML strings.
       */
      Requestr.parsePage = function(request, callback, mutator) {
        // Only parsing page if service is available.
        if (Requestr.service) {
          // Dispatching load complete event.
          Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE);
          // Cleaning up listeners to recycle xhr.
          Requestr.removePageLoadXhrListeners();
          // Getting the document from the XHR, response is document typed.
          Requestr.ownerDocument = request.target.response;
          /* TODO (jam@): Determine optimal process for injecting content.
           * This should be astracted more and offer more options, such
           * as injections by element targeting or parsing/transforming.
           */
          // Add HTML injection before parsing, so should be absolute URLs.
          if (mutator || (mutator = Requestr.xhr.documentMutator)) {
            // Checking for mutators to be in the head.
            if (mutator.head) {
              // Adding injection before head content.
              if (mutator.head.before) {
                Requestr.ownerDocument.head.innerHTML =
                  mutator.head.before + Requestr.ownerDocument.head.innerHTML;
              }
              // Adding injection after head content.
              if (mutator.head.after) {
                Requestr.ownerDocument.head.innerHTML =
                  Requestr.ownerDocument.head.innerHTML + mutator.head.after;
              }
            }
            // Checking for mutators to be in the body.
            if (mutator.body) {
              // Adding injection before body content.
              if (mutator.body.before) {
                Requestr.ownerDocument.body.innerHTML =
                  mutator.body.before + Requestr.ownerDocument.body.innerHTML;
              }
              // Adding injection after body content.
              if (mutator.body.after) {
                Requestr.ownerDocument.body.innerHTML =
                  Requestr.ownerDocument.body.innerHTML + mutator.body.after;
              }
            }
          }
          // Initializing local variables.
          var i, j, length, jLength, currEl, requestUrls = [], baseEl,
              elementToRemove, styleCssString, styleCssUrls, manualUrlResolve,
              requestingElements = Requestr.ownerDocument.querySelectorAll(Requestr.ELEMENTS_QUERY);
          // Getting URL assets to resolve from elements making requests.
          for (i = 0, length = requestingElements.length; (currEl = requestingElements[i]); i++) {
            // Building list of URL requests to combine server side.
            // Filtering by allowed node list.
            if (Requestr.urlParsingEnabledElement[currEl.nodeName]) {
              // TODO (jam@): Add proper check for CSS link element, not icon or other.
              if (currEl.nodeType === 1 && (currEl.nodeName === 'LINK') && currEl.href) {
                // CSS is requested as strings to allow faster client-side parsing.
                requestUrls.push({
                  Url: currEl.href,
                  Token: null,
                  Type: 'STRING'
                });
              } else {
                // Request defaults to data URI.
                requestUrls.push({
                  Url: currEl.src || currEl.href,
                  Token: null
                });
              }
              // TODO (jam@): Improve this, currently asserting all elements
              // have absolute paths as the parsing relies on such value (server).
              if (currEl.src) {
                currEl.setAttribute('src', currEl.src);
              } else if (currEl.href) {
                currEl.setAttribute('href', currEl.href);
              }
            }
          }
          /*
           * Checking for document to have a base element, if none,
           * applying the location to the document as the base so
           * all HTTP requests are properly resolved.
           */
          if ((baseEl = Requestr.ownerDocument.getElementsByTagName('base')).length === 0) {
            baseEl = Requestr.ownerDocument.createElement('base');
            baseEl.setAttribute('href', Requestr.ownerDocument.URL);
            // TODO (jam@): File bug against Firefox, base element only
            // resolves requests made after it's occurance in the DOM.
            Requestr.ownerDocument.head.insertBefore(baseEl, Requestr.ownerDocument.head.firstChild);
          }
          // Removing serialization element since no longer needed.
          if ((elementToRemove = Requestr.ownerDocument.querySelector(Requestr.SERIALIZATION_QUERY))) {
            elementToRemove.parentNode.removeChild(elementToRemove);
          }
          // Removing Requestr script element since no longer neded.
          if ((elementToRemove = Requestr.ownerDocument.querySelector('[' + Requestr.JS_ELEMENT_ATTRIBUTE + ']'))) {
            elementToRemove.parentNode.removeChild(elementToRemove);
          }
          // Parsing style elements for URLs in CSS rules.
          requestingElements = Requestr.ownerDocument.getElementsByTagName('style');
          for (i = 0, length = requestingElements.length; (currEl = requestingElements[i]); i++) {
            // TODO (jam@): Firefox bug was filed, but will most likely need to implement fix.
            // Firefox Issue Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=925493
            if (currEl.sheet &&
                // Currently Chrome is the only browser that resolves URLs.
                window.chrome) {
              // Getting CSS string with resolved URLs.
              styleCssString = Requestr.getParseCssFromRules(currEl.sheet.rules);
              // Replacing CSS string with URLs resolved CSS string.
              // TODO (jam@): Standardize.
              if (currEl.innerText) {
                currEl.innerText = styleCssString;
              } else if (currEl.textContent) {
                currEl.textContent = styleCssString;
              }
              // Getting URLs from CSS string.
              styleCssUrls = Requestr.getUrlsFromCssString(styleCssString);
            } else {
              // Getting CSS string for parsing.
              if (currEl.innerText) {
                styleCssString = currEl.innerText;
              } else if (currEl.textContent) {
                styleCssString = currEl.textContent;
              }
              // Manually resolving URLs.
              manualUrlResolve = {Url: Requestr.ownerDocument.URL, Data: styleCssString};
              // Getting URLs from CSS string.
              styleCssUrls = Requestr.parseCssResourcesForUrls([manualUrlResolve]);
              // Replacing CSS string with URLs resolved CSS string.
              // TODO (jam@): Standardize.
              if (currEl.innerText) {
                currEl.innerText = manualUrlResolve.Data;
              } else if (currEl.textContent) {
                currEl.textContent = manualUrlResolve.Data;
              }
            }
            // Adding, if any, URLs from CSS to initial request from service.
            if (styleCssUrls) {
              for (j = 0, jLength = styleCssUrls.length; j < jLength; j++) {
                // Adding URLs to request from service.
                requestUrls.push({
                  Url: styleCssUrls[j],
                  Token: null
                });
              }
            }
          }
          // Getting the document string for parsing during url resolving.
          Requestr.documentString = Requestr.ownerDocument.documentElement.outerHTML;
          // TODO (jam@): Improve, this is bad, should be better way to keep reference.
          if (Requestr.xhr && Requestr.xhr.blobUrlCallback) {
            callback = Requestr.xhr.blobUrlCallback;
          }
          /*
           * Requesting all HTTP requests via a single request from the server.
           * The requests are returned as a dataURI array, which we then turn
           * into a blob and URL object that replaces the original URL.
           */
          Requestr.requestDataUriFromService(Requestr.service, requestUrls, {
            load: Requestr.handleResponseResources,
            error: Requestr.handleResponseResourcesError,
            progress: Requestr.handleResponseResourcesProgress,
            abort: Requestr.handleResponseResourcesAbort
          }, callback);
          // Dispatching load start event.
          Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_LOAD_START);
        } else {
          // TODO (jam@): Add handler if no Requestr service is define in serialization.
        }
      };
      /**
       * Fetches an array of URLs as data URIs from a service.
       * @param {string} service The location of the data URI API.
       * @param {Array.<string>} urls Array of urls to fetch from server.
       * @param {Object} handler Object containing event handling methods for status.
       * @param {Function=} callback Optional method stores in XHR for handlers.
       * @param {Number=} maxFileSizeOverWrite Optional max file size to overwrite defaults.
       */
      Requestr.requestDataUriFromService = function(service, urls, handler, callback, maxFileSizeOverWrite) {
        // XHR request to the service to get data URIs.
        Requestr.xhr = new XMLHttpRequest();
        Requestr.xhr.open('POST', service, true);
        Requestr.xhr.setRequestHeader('Content-type', 'application/json');
        Requestr.xhr.setRequestHeader('Accept', 'application/json');
        // Passing callback if defined.
        if (callback) {
          Requestr.xhr.blobUrlCallback = callback;
        }
        // TODO (jam@): Remove when properly supported by all browsers.
        // Avoiding a browser error if not supported.
        try {
          Requestr.xhr.responseType = 'json';
        } catch (error) {
          // TODO (jam@): Add any error handling if needed, shouldn't be at this point.
        }
        // Adding XHR status event handlers.
        if (handler) {
          if (typeof handler.load === 'function') {
            Requestr.xhr.addEventListener('load', handler.load, true);
          }
          if (typeof handler.error === 'function') {
            Requestr.xhr.addEventListener('error', handler.error, true);
          }
          if (typeof handler.progress === 'function') {
            Requestr.xhr.addEventListener('progress', handler.progress, true);
          }
          if (typeof handler.abort === 'function') {
            Requestr.xhr.addEventListener('abort', handler.abort, true);
          }
        }
        // Sending request for URI data.
        Requestr.xhr.send(JSON.stringify({
          MaxSize: maxFileSizeOverWrite || (Requestr.serialization ? Requestr.serialization.maxFileSize : null) || Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE,
          Urls: urls
        }));
      };
      /**
       * Conducts a nested level of parsing for requests made in any
       * CSS string, meaning style or link elements or inline styles.
       * @param {CSSRuleList} rules The array of CSS rules.
       * @return {string=} The string of all the CSS rules.
       */
      Requestr.getParseCssFromRules = function(rules) {
        if (rules) {
          var i, length = rules.length, css = '';
          for (i = 0; i < length; i++) {
            // This returns the same CSS with resolved URLs.
            css += rules[i].cssText;
          }
          return Requestr.getNormalizedCssString(css);
        } else {
          return null;
        }
      };
      /**
       * Normalizes CSS strings that were parsed by the browser,
       * which means just removing known quirks manually, which
       * it shouldn't be the case.
       * @param {string} css The string of CSS to normalized.
       * @return {string} The normalized CSS.
       */
      Requestr.getNormalizedCssString = function(css) {
        // TODO (jam@): Determine if this is needed, this is horrible, Chrome is
        // injecting properties to rules for no reason.
        return (css.replace(/background\-position\: initial initial;/gi, '')).
            replace(/background\-repeat\: initial initial;/gi, '');
      };
      /**
       * Gets the URLs embedded in a CSS string.
       * @param {string} css A string containing CSS definitions.
       * @return {Array=} Returns an array of the URLs in the CSS or null if none.
       */
      Requestr.getUrlsFromCssString = function(css) {
        // Getting array of URLs in the CSS string.
        var styleCssUrls = css.match(/url\(()(.+?)\1\)/gi);
        // Checking to see if we have some URLs in the CSS before validating.
        if (Array.isArray(styleCssUrls)) {
          // Getting actual URLs from CSS value array.
          styleCssUrls = styleCssUrls.toString().match(/(\b(?:(?:https?|ftp|file|[A-Za-z]+):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$]))/gi);
        } else {
          styleCssUrls = null;
        }
        return styleCssUrls;
      };
      /**
       * Removing listeners after end event.
       */
      Requestr.removeResponseLoadXhrListener = function() {
        if (Requestr.xhr) {
          Requestr.xhr.removeEventListener('load', Requestr.handleResponseResources, true);
          Requestr.xhr.removeEventListener('error', Requestr.handleResponseResourcesError, true);
          Requestr.xhr.removeEventListener('progress', Requestr.handleResponseResourcesProgress, true);
          Requestr.xhr.removeEventListener('abort', Requestr.handleResponseResourcesAbort, true);
        }
      };
      /**
       * Gets the response resources data and created blob URLs
       * and replaces URLs in document with such.
       * @param {Event} request The XHR response with the URI data.
       */
      Requestr.handleResponseResources = function(request) {
        // Dispatching complete event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_LOAD_COMPLETE);
        // Cleaning up listeners to recycle xhr.
        Requestr.removeResponseLoadXhrListener();
        // Fix for browsers not supporting json responseType XHRs.
        if (typeof request.target.response !== 'object') {
          // TODO (jam@): Removed when Chrome (shipping, v30 supports it)
          // and IE support it.
          request = JSON.parse(request.target.response);
        } else {
          request = request.target.response;
        }
        // Getting array of files as URIs or alternate result(s).
        var dataSet = request, styleEls, i, cssUrls,
            docString = Requestr.documentString, cssResources = [],
            sourceSet = dataSet.Resources, currSource,
            dimp = window.document.implementation.createHTMLDocument(''),
            callback = Requestr.xhr.blobUrlCallback;
        // TODO (jam@): Add error details.
        if (!dataSet.Resources) {
          // Dispatching error event.
          Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_API_ERROR);
        }
        // Creating DOMImplementation for URL parsing via DOM query selectors.
        dimp.documentElement.innerHTML = docString;
        // Dispatching resolving resources event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_RESOLVING);
        // Getting style elements to parse CSS strings for URLs
        styleEls = dimp.getElementsByTagName('style');
        // Creating urls from blobs and replacing the HTML string value with blob's.
        if (sourceSet) {
          for (i = 0; (currSource = sourceSet[i]); i++) {
            // Resolving resource with blob URL.
            if (currSource.ContentType === 'text/css' && currSource.Type === 'STRING') {
              // CSS resources are treated for a second level parsing.
              cssResources.push(currSource);
            } else {
              Requestr.replaceDocumentUrlsWithBlob(currSource, dimp, styleEls);
            }
          }
          // Getting all resolved URLs from all external CSS.
          cssUrls = Requestr.parseCssResourcesForUrls(cssResources);
        }
        // Checks if external CSS needs additional parsing, otherwise completes document.
        if ((cssResources.length > 0) && (cssUrls && cssUrls.length > 0)) {
          Requestr.loadExternalCssUrls(cssUrls, cssResources, dimp, styleEls, function() {
            Requestr.completeResolvingDocument(dimp, Requestr.ownerDocument, callback);
          });
        } else if (cssResources.length > 0) {
          // TODO (jam@): Improve, should do better job at handle statement.
          Requestr.loadExternalCssUrls([], cssResources, dimp, styleEls, function() {
            Requestr.completeResolvingDocument(dimp, Requestr.ownerDocument, callback);
          });
        } else {
          Requestr.completeResolvingDocument(dimp, Requestr.ownerDocument, callback);
        }
        // Cleaning up.
        Requestr.xhr = null;
      };
      /**
       * Completes the document parsing cycle and call proper complete method.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed document.
       * @param {HTMLDocument} owner The original document loaded via XHR.
       * @param {Function=} callback Optional callback method, if not defined
       *     the window.document is replaced otherwise a blob URL passed.
       */
      Requestr.completeResolvingDocument = function(dimp, owner, callback) {
        // Checking whether to load document in memory or replace current.
        if (!callback || typeof callback !== 'function') {
          // Loading the document from parsed string.
          Requestr.setDocumentHtml(owner, dimp.documentElement.outerHTML);
        } else {
          // Creating window.URL from document.
          Requestr.createDocumentBlobUrl(dimp, owner, callback);
          // Removing class that allowed styling.
          document.documentElement.classList.remove(Requestr.LOADING_CLASS);
        }
      };
      /**
       * Loads the requests in external CSS fetched from the service.
       * @param {Array.<string>} urls The array of URLs to fetch.
       * @param {Array.<Object>} css The resource objects containing CSS
       *     previously fetched from the service.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed document.
       * @param {Array.<StyleElement} styles Array of style elements in dimp.
       * @param {Function=} callback Optional callback method upon complete.
       */
      Requestr.loadExternalCssUrls = function(urls, css, dimp, styles, callback) {
        // TODO (jam@): Improve the parameters needed, just prototyping now.
        var i, currUrl, length = urls.length, externalRequests = [], requestUrls;
        // Building array of additional URLs not already obtained.
        for (i = 0; i < length; i++) {
          currUrl = urls[i];
          if (!Requestr.resolvedUrls[currUrl]) {
            externalRequests.push({
              Url: currUrl,
              Token: null
            });
          }
        }
        // Resolving CSS URLs or making service request for additonal resources.
        if (externalRequests.length === 0) {
          // Does not contain additional external assets.
          Requestr.resolveDocumentCssUrls(css, dimp, styles, callback);
        } else {
          // Loading external CSS requests.
          Requestr.requestDataUriFromService(Requestr.service, externalRequests, {
            progress: Requestr.handleExternalCssProgress,
            load: function(requests) {
              Requestr.handleDocumentCssUris(requests, css, dimp, styles, callback);
            },
            error: function(error) {
              Requestr.handleExternalCssResourcesError(error);
              Requestr.resolveDocumentCssUrls(css, dimp, styles, callback);
            },
            abort: function(error) {
              Requestr.handleExternalCssResourcesError(error);
              Requestr.resolveDocumentCssUrls(css, dimp, styles, callback);
            }
          });
          // Dispatching start event.
          Requestr.dispatchCustomEvent(Requestr.customEvents.EXTERNAL_CSS_LOAD_START);
        }
      };
      /**
       * Dispatches a progress event for the embedded css resources being loaded.
       * @param {Event} progress The progress event for the XHR of the resources.
       */
      Requestr.handleExternalCssProgress = function(progress) {
        // Dispatching css loading progress event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.EXTERNAL_CSS_LOAD_PROGRESS, {
          bytes: Math.round(progress.loaded)
        });
      };
      /**
       * Dispatches an error event for the embedded css resources being loaded.
       * @param {Event} error The error event for the XHR of the resources.
       */
      Requestr.handleExternalCssResourcesError = function(error) {
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(Requestr.customEvents.EXTERNAL_CSS_LOAD_ERROR, {
          error: error
        });
      };
      /**
       * Creates URLs from data URIs and parses CSS in recursion.
       * @param {Event} requests The XHR JSON typed request.
       * @param {Array.<Object>} css The resource objects containing CSS
       *     previously fetched from the service.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed document.
       * @param {Array.<StyleElement} styles Array of style elements in dimp.
       * @param {Function=} callback Optional callback method upon complete.
       */
      Requestr.handleDocumentCssUris = function(requests, css, dimp, styles, callback) {
        // Dispatching complete event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE);
        // TODO (jam@): Improve the parameters needed, just prototyping now.
        var i, currSource, cssUrls, cssResources,
            sourceSet = requests.target.response.Resources;
        // Checking for actual fetched resources.
        if (sourceSet) {
          for (i = 0; (currSource = sourceSet[i]); i++) {
            // Resolving resource with blob URL.
            if (currSource.ContentType === 'text/css' && currSource.Type === 'STRING') {
              // CSS resources are treated for a second level parsing.
              cssResources.push(currSource);
            } else {
              //
              Requestr.createUrlFromResource(currSource);
            }
          }
          // Getting all resolved URLs from all external CSS.
          cssUrls = Requestr.parseCssResourcesForUrls(cssResources);
        }
        if (!cssUrls) {
          Requestr.resolveDocumentCssUrls(css, dimp, styles, callback);
        } else {
          // TODO (jam@): Add recursion for CSS imports.
          console.log('Error: CSS imports not currently supported!');
        }
      };
      /**
       * Resolves URLs in external CSS.
       * @param {Array.<Object>} css Array of external CSS data from service.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed document.
       * @param {Array.<StyleElement} styles Array of style elements in dimp.
       * @param {Function=} callback Optional callback method upon complete.
       */
      Requestr.resolveDocumentCssUrls = function(css, dimp, styles, callback) {
        var urls = Requestr.resolvedUrls, url, i, currCss;
        // Parsing each CSS string and swapping URLs with blob URLs.
        for (i = 0; (currCss = css[i]); i++) {
          for (url in urls) {
            currCss.Data = currCss.Data.replace(new RegExp(Requestr.thirdParty.preg_quote(url), 'gi'), urls[url]);
          }
          // Once parsed, creating blob from CSS resource.
          Requestr.replaceDocumentUrlsWithBlob(currCss, dimp, styles);
        }
        // Making callback.
        if (typeof callback === 'function') {
          callback();
        }
      };
      /**
       * Parses the URLs from the CSS strings returned by the service
       * @param {Array.<Object>} cssResources Array of CSS resources fetched from service.
       * @return {Array.<string>} Array of URLs parsed from CSS string.
       */
      Requestr.parseCssResourcesForUrls = function(cssResources) {
        var style, base, anchor, dimp, i, urls = [], sheetUrls, resolveUrl,
            length = (Array.isArray(cssResources) ? cssResources.length : 0),
            currResource;
        // Fallback, using the browser to resolve the URL.
        resolveUrl = function(source) {
          // TODO (jam@): Improve, this is super slow, should be single Regex.
          anchor.setAttribute('href', source.match(/\((.*?)\)/)[1]);
          return 'url(' + anchor.href + ')';
        };
        if (length > 0) {
          // Looping through CSS resources to parse URLs.
          for (i = 0; i < length; i++) {
            currResource = cssResources[i];
            // Creating DOM Implementation to have the browser resolve URLs.
            dimp = window.document.implementation.createHTMLDocument('');
            base = dimp.createElement('base');
            style = dimp.createElement('style');
            // Using the CSS URL as the base for resolving rules.
            base.setAttribute('href', currResource.Url);
            // Using a style element to resolve the rules.
            style.innerHTML = currResource.Data;
            // Once added, the resolving happens.
            dimp.head.appendChild(base);
            dimp.head.appendChild(style);
            // Checking for the style element to have valid stylesheet.
            if (style.sheet &&
                // Currently Chrome is the only browser that resolves URLs.
                window.chrome) {
              // Getting URLs from cssRules, which will have absolute resolved URLs.
              sheetUrls = Requestr.getUrlsFromCssString((currResource.Data = Requestr.getParseCssFromRules(style.sheet.cssRules)));
            } else {
              // Fallback to string parsing if browser doesn't support
              // resolving URLs embedded in CSS (style or link).
              anchor = dimp.createElement('a');
              dimp.body.appendChild(anchor);
              // TODO (jam@): Improve URL parsing, this could be very slow.
              currResource.Data = currResource.Data.replace(/\burl\((\'|\"|)([^\'\"]+?)\1\)/g, resolveUrl);
              // Getting URLs from cssRules, which will have absolute resolved URLs.
              sheetUrls = Requestr.getUrlsFromCssString(currResource.Data);
            }
            // Adding URLs from current cssResource to array of URLs to fetch.
            if (sheetUrls) {
              urls = urls.concat(sheetUrls);
            }
            // manual garbage collection.
            dimp = base = style = null;
          }
          // Returning array of URLs parsed from CSS strings.
          return urls;
        }
      };
      /**
       * Converts an URI resource to a typed blob window.URL.
       * @param {Object} resource The returned object from the API service.
       * @param {string} The window.URL created from the blob.
       */
      Requestr.createUrlFromResource = function(resource) {
        // Converting dataURI to a typed blob.
        var url, blob = (resource.Type === 'STRING' ?
              Requestr.dataStringToBlob(resource.Data, resource.ContentType) :
              Requestr.dataURItoBlob(resource.Data, resource.ContentType));
        // Generating url from blob.
        return (Requestr.resolvedUrls[resource.Url] = window.URL.createObjectURL(blob));
      };
      /**
       * Creates blob URL from asset and replaces the original value in elements.
       * @param {Object} currSource The object containing the data to create the blob.
       * @param {HTMLDocument} dimp The in memory document to use for the operation.
       */
      Requestr.replaceDocumentUrlsWithBlob = function(currSource, dimp, styleEls) {
        // Converting dataURI to a typed blob.
        var j, k, currMatchEl, matchingEls, currStyleEl,
            // Generating url from blob.
            url = Requestr.createUrlFromResource(currSource);
        // TODO (jam@): Improve query matching logic, should be flexible by defined attribute list.
        matchingEls = dimp.querySelectorAll('[src="' + currSource.Url + '"], [href="' + currSource.Url + '"]');
        // Replacing original assets url with blob url.
        for (j = 0; (currMatchEl = matchingEls[j]); j++) {
          if (currMatchEl.src) {
            currMatchEl.setAttribute('src', url);
          }
          if (currMatchEl.href) {
            currMatchEl.setAttribute('href', url);
          }
        }
        // Replacing original CSS string with CSS string containing parsed URLs.
        for (k = 0; (currStyleEl = styleEls[k]); k++) {
          // TODO (jam@): Standadize.
          if (currStyleEl.innerText) {
            currStyleEl.innerText = currStyleEl.innerText.replace(new RegExp(Requestr.thirdParty.preg_quote(currSource.Url), 'gi'), url);
          } else if (currStyleEl.textContent) {
            currStyleEl.textContent = currStyleEl.textContent.replace(new RegExp(Requestr.thirdParty.preg_quote(currSource.Url), 'gi'), url);
          }

        }
      };
      /**
       * Dispatches a progress event for the resources being loaded.
       * @param {Event} progress The progress event for the XHR of the resources.
       */
      Requestr.handleResponseResourcesProgress = function(progress) {
        // Dispatching bytes loaded event since can't get size.
        Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_LOAD_PROGRESS, {
          bytes: Math.round(progress.loaded)
        });
      };
      /**
       * Dispatches an error event for the resources being loaded.
       * @param {Event} abort The error event for the XHR of the resources.
       */
      Requestr.handleResponseResourcesAbort = function(abort) {
        // Cleaning up listeners to recycle xhr.
        Requestr.removeResponseLoadXhrListener();
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_LOAD_ERROR, {
          error: abort
        });
        // TODO (jam@): Add appropiate load fallback option.
      };
      /**
       * Handles API requests error, renders the document without
       * combining all HTTP requests.
       * @param {Event} error The error event for the XHR of the resources.
       */
      Requestr.handleResponseResourcesError = function(error) {
        // Cleaning up listeners to recycle xhr.
        Requestr.removeResponseLoadXhrListener();
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(Requestr.customEvents.RESOURCE_LOAD_ERROR, {
          error: error
        });
        /*
         * TODO (jam@): If API is down, we can make all the requests just once
         * individually and still store as blob URLs for subsequent requests.
         */
        Requestr.setDocumentHtml(Requestr.ownerDocument, Requestr.documentString);
      };
      /**
       * Converts a dataURI to a binary blob.
       * @param {string} data The data URI string of the asset.
       * @param {string} type The mime tupe of the asset.
       * @return {Blob} The created blob.
       */
      Requestr.dataURItoBlob = function(data, type) {
        var i, dataArray = [],
            bString = atob(data.split(',')[1]),
                    length = bString.length;
        for (i = 0; i < length; i++) {
          dataArray.push(bString.charCodeAt(i));
        }
        return new Blob([new Uint8Array(dataArray)], {
          type: type ? type : 'text/plain'
        });
      };
      /**
       * Converts a string to a typed Blob.
       * @param {string} data The string data representation.
       * @param {string} mime The mime-type to type the blob.
       * @return {Blob} The created from data Blob.
       */
      Requestr.dataStringToBlob = function(data, mime) {
        return Requestr.dataURItoBlob('data:' + mime + ';base64,' + btoa(unescape(encodeURIComponent(data))), mime);
      };
      /**
       * Replaces current document with full HTML string, dispatches
       * a ready event for notification. All documents are assumed to be the
       * same as the template/root document.
       * @param {HTMLDocument} doc The HTML document parsed.
       * @param {string} html The HTML string to user for replacing document.
       */
      Requestr.setDocumentHtml = function(doc, html) {
        var dimp = window.document.implementation.createHTMLDocument(''),
            i, script, scriptEl;
        // Loading the HTML string to an in-memory DOM for parsing.
        dimp.documentElement.innerHTML = html;
        // Syncing attributes sets on documentElement since it's a read-only element.
        Requestr.setDocumentElementAttributes(document.documentElement, doc.documentElement);
        document.documentElement.innerHTML = html;
        /*
         * TODO (jam@): Determine if the 'load' event should be wrapped
         * in a MutationObserver for the DOM to be ready. Also, determine
         * other elements besides 'script' would need such re-enabling.
         */
        script = document.querySelectorAll('script');
        // Enabling all script elements manually since disabled via innerHTML.
        for (i = 0; (scriptEl = script[i]); i++) {
          // Creating new working script element.
          var newScriptEl = document.createElement('script');
          // Copying attributes.
          Requestr.duplicateElementAttributes(scriptEl, newScriptEl);
          // TODO (jam@): Handle no content.
          newScriptEl.textContent = scriptEl.textContent || scriptEl.innerText;
          // Inserting the element at the same position in the document.
          scriptEl.parentNode.insertBefore(newScriptEl, scriptEl);
          scriptEl.parentNode.removeChild(scriptEl);
        }
        // Removing class that allowed styling.
        document.documentElement.classList.remove(Requestr.LOADING_CLASS);
        // Faking load event so all other script work as is.
        window.dispatchEvent(new CustomEvent('load'));
        // Dispatching rendered event.
        Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_RENDERED, {
          document: html
        });
      };
      /**
       * Create a window.URL from a blob of an HTML document.
       * @param {HTMLDocument} dimp The HTML document containing the parsed URLs.
       * @param {HTMLDocument} doc The HTML document read via original XHR.
       * @param {Function} callback The callback method to receive the outcome,
       *     send an object with the url and parsed HTML string.
       */
      Requestr.createDocumentBlobUrl = function(dimp, doc, callback) {
        // Syncing attributes set on documentElement since it's a read-only element.
        Requestr.setDocumentElementAttributes(dimp.documentElement, doc.documentElement);
        // Creating URL from blob.
        var blobUrl = window.URL.createObjectURL(Requestr.dataStringToBlob(dimp.documentElement.outerHTML, 'text/html'));
        // TODO (jam@): A bug has been filed, hoping it makes it to the HTML spec
        // as browsers are not allowing query strings in blob URLs, which means
        // that if the blob URL is post-fixed with a query string it will not
        // be resolved by the browser and break.
        // Issue was filed with Firefox:
        // http://bugzilla.mozilla.org/show_bug.cgi?id=928121
        if (typeof callback === 'function') {
          // Making callback with object containing the blob URL and
          // the parsed document string.
          callback({
            url: blobUrl,
            html: dimp.documentElement.outerHTML
          });
          // Dispatching blob created event.
          Requestr.dispatchCustomEvent(Requestr.customEvents.DOCUMENT_BLOB_URL_CREATED, {
            url: blobUrl,
            html: dimp.documentElement.outerHTML
          });
        } else {
          //TODO (jam@): Add error handling.
        }
      };
      /**
       * Copy all the attributes from one element to another.
       * @param {HTMLElement} fromElement The element to copy the attributes from.
       * @param {HTMLElement} toElement The element to copy the attributes to.
       */
      Requestr.duplicateElementAttributes = function(fromElement, toElement) {
        // Getting attributes from element.
        var i, length, currAttr, attrs = fromElement.attributes;
        for (i = 0, length = attrs.length; i < length; i++) {
          currAttr = attrs[i];
          toElement.setAttribute(currAttr.name, currAttr.value);
        }
      };
      /**
       * Sets the documentElement attributes from new element, removes old.
       * @param {HTMLElement} oriDocEl The original documentElement.
       * @param {HTMLElement} newDocEl The new documentElement.
       */
      Requestr.setDocumentElementAttributes = function(oriDocEl, newDocEl) {
        var attrs, i, length, currAttr;
        // Deleting old attribute.
        attrs = oriDocEl.attributes;
        for (i = 0, length = attrs.length; i < length; i++) {
          currAttr = attrs[i];
          if (currAttr) {
            oriDocEl.removeAttribute(currAttr.name);
          }
        }
        // Setting new attributes.
        Requestr.duplicateElementAttributes(newDocEl, oriDocEl);
        // Garbage collection.
        attrs = currAttr = i = length = null;
      };
      /* -------------------------------------------
         [START] Third party helper methods
         ------------------------------------------- */
      /**
       * The following functionality was taken from:
       * https://github.com/kvz/phpjs/blob/master/functions/pcre/preg_quote.js
       *
       * Copyright (c) 2013 Kevin van Zonneveld (http://kvz.io)
       * and Contributors (http://phpjs.org/authors)
       *
       * Permission is hereby granted, free of charge, to any person obtaining a copy of
       * this software and associated documentation files (the "Software"), to deal in
       * the Software without restriction, including without limitation the rights to
       * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
       * of the Software, and to permit persons to whom the Software is furnished to do
       * so, subject to the following conditions:
       *
       * The above copyright notice and this permission notice shall be included in all
       * copies or substantial portions of the Software.
       *
       * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
       * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
       * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
       * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
       * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
       * SOFTWARE.
       *
       * Converts an URL to a string to use in Regex replacing.
       * @param {string} str The url string to normalize.
       * @return {string} The parsed string.
       */
      Requestr.thirdParty.preg_quote = function(str) {
        return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
      };
        /* -------------------------------------------
           [END] Third party helper methods
           ------------------------------------------- */
      // Checking for serialization to initialize Requestr.
      if (Requestr.serialization) {
        Requestr.parseSerialization(Requestr.serialization);
      } else {
        // This is needed if the serialization is loaded after the element
        // loading Requestr, meaning all serialization should be placed
        // prior to the Requestr script for optimal performance.
        window.addEventListener('DOMContentLoaded', function() {
          Requestr.parseSerialization((Requestr.serialization = document.querySelector(Requestr.SERIALIZATION_QUERY)));
        });
      }
    }());
  }
}
