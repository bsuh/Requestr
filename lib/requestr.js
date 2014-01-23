/**
 * Reduce network requests at runtime.
 *
 * Copyright (C) 2013, Tradeshift. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 * @author jam@tradeshift.com (José Antonio Márquez Russo)
 * https://github.com/Tradeshift/Requestr
 */

/*
 * TODO (jam@):
 * + IMPORTANT: Backend API should accept and relay user-agent when
 *   requesting page!
 * + Add recursive CSS parsing on server-side
 * + Allow user define element node names and attributes for
 *   parsing (also disable)
 * + Add parsing for inline styles
 * + Add missing events in new parsing steps
 * + Add recursion for CSS imports
 * + Improve logic for load event to be redispatched to include
 *   unresolved elements
 * + Update loadPage method to not rely on API when local
 *   JSON is supported.
 * + Load 'self' is broken, 'owner' works as expected.
 * + When loading via 'owner' in document styles seems to
 *   not use blobs when resolving.
 */
if (typeof window !== 'undefined') {
  // Checking for Requestr to prevent reinit.
  if (!window.Requestr) {
    // Polyfill for CustomEvent if not supported by browser (IE).
    (function() {
      function CustomEvent(event, params) {
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: undefined
        };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles,
            params.cancelable, params.detail);
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
      // Firefox makes this a getter only, so adding a check to prevent error.
      if (!window.indexedDB) {
        window.indexedDB = window.mozIndexedDB ||
            window.webkitIndexedDB || window.msIndexedDB;
      }
      // Add Requestr as a global, might be optinal depending on mode.
      var Requestr = window.Requestr = {};
      /**
       * The class attribute added to the documentElement while loading.
       */
      Requestr.LOADING_CLASS = 'requestr';
      /**
       * The query selector string to use to find elements.
       */
      Requestr.ELEMENTS_QUERY =
          '[rel~="stylesheet"][href], [rel~="icon"][href], [src]';
      /**
       * The query selector string to find serialization element.
       */
      Requestr.SERIALIZATION_QUERY =
          'script[type="text/requestr-serialization"]';
      /**
       * The attribute used to indicate the element loading Requestr.
       */
      Requestr.JS_ELEMENT_ATTRIBUTE = 'data-requestr-js';
      /**
       * The attribute used to store the orignal URL of the request
       * made by the element replaced by Requestr. This is helpful
       * for debugging.
       */
      Requestr.ORIGINAL_URL_ATTRIBUTE = 'data-requestr-url';
      /**
       * Default file size for files to be converted to URIs in bytes.
       */
      Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE = 40000;
      /**
       * Getting the serialization elements if specified in document.
       */
      Requestr.serialization =
          document.querySelector(Requestr.SERIALIZATION_QUERY);
      /**
       * User define event callback handler (might change to be dispatch).
       */
      Requestr.onEvent = null;
      /**
       * List of node names allowed to be parsed.
       */
      Requestr.urlParsingEnabledElement = {
        'IMG': true,
        'LINK': true,
        'SCRIPT': true
      };
      /**
       * Pattern used for match URLs in strings.
       */
      Requestr.matchUrlPattern = new RegExp(
          '(\\b(?:(?:https?|ftp|file|[A-Za-z]+):\\/\\/|www\\.|ftp\\.)(?:\\(' +
          '[-A-Z0-9+&@#\\/%=~_|$?!:,.]*\\)|[-A-Z0-9+&@#\\/%=~_|$?!:,.])*(?:' +
          '\\([-A-Z0-9+&@#\\/%=~_|$?!:,.]*\\)|[A-Z0-9+&@#\\/%=~_|$]))', 'gi');
      /**
       * Stores the already resolved URLs.
       */
      Requestr.resolvedUrls = [];
      /**
       * Third party code used by Requestr.
       */
      Requestr.thirdParty = {};
      /**
       * Checking for browser type, used for quirks in parsing.
       */
      Requestr.browser = {
        userAgent: navigator.userAgent.toLowerCase()
      };
      Requestr.browser.isSafari =
          (Requestr.browser.userAgent.indexOf('safari') > -1);
      Requestr.browser.isFirefox =
          (Requestr.browser.userAgent.indexOf('firefox') > -1);
      Requestr.browser.ieInternetExplorer =
          (Requestr.browser.userAgent.indexOf('msie') > -1);
      /**
       * Custom events dispatched by Requestr.
       * @enum {string}
       */
      Requestr.customEvents = {
        // Requestr events.
        REQUESTR_READY: 'requestrReady',
        REQUESTR_ERROR: 'requestrError',
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
       * Custom error events dispatched by Requestr using the
       * Requestr.customEvents.REQUESTR_ERROR event.
       * @enum {string}
       */
      Requestr.customErrors = {
        CACHING: 'caching',
        SERIALIZATION: 'serialization',
        SERVICE: 'service'
      };
      /**
       * Name for the caching database.
       */
      Requestr.CACHING_DB_NAME = 'Requestr';
      /**
       * Name for the table to store cached resource data.
       */
      Requestr.CACHING_DB_STORE_NAME = 'datauris';
      /**
       * Key used to enter and sort resources in table.
       */
      Requestr.CACHING_DB_STORE_KEY = 'url';
      /**
       * Database version to use for caching.
       */
      Requestr.CACHING_DB_VERSION = 1;
      /**
       * Reference to database.
       */
      Requestr.localDb = null;
      /**
       * Reference to polyfill database.
       */
      Requestr.localDbPolyfill = null;
      /**
       * Keeping track of resources to cache.
       */
      Requestr.resourcesToCache = [];
      /**
       * Keeping track of resources in local cache.
       */
      Requestr.resourcesFetchedFromCache = [];
      /**
       * Requestr's cache handling.
       */
      Requestr.cache = {
        expires: null,
        pollyfill: {
          websql: {}
        }
      };
      /**
       * Default size in bytes for WebSQL polyfill.
       */
      Requestr.WEBSQL_DEFAULT_SIZE = 2.5 * 1024 * 1024;
      /**
       * Make callback with custom events Requestr to defined method.
       * @param {string} evt The custom event to dispath by via Requestr.
       * @param {Object=} opt_data Optional event data set is
       *     customData property.
       */
      Requestr.dispatchCustomEvent = function(evt, opt_data) {
        // Checking for function to be defined.
        if (typeof Requestr.onEvent === 'function') {
          // Making CustomEvent callback handler.
          Requestr.onEvent((opt_data ? (new CustomEvent(evt,
              {'detail': opt_data})) : (new CustomEvent(evt))));
        }
      };
      /**
       * Dispatches custom event with error details, not throwing error
       * to not block page from running.
       * @param {string} type The type of error.
       * @param {string} message The message to send to user with error.
       * @param {*=} opt_details Optional details to include when dispatching
       *     custom error event for user to handle.
       */
      Requestr.dispatchError = function(type, message, opt_details) {
        // Dispatching custom event with error details.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.REQUESTR_ERROR,
            {type: type,
              message: message,
              details: opt_details}
        );
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
          // IE only method since it does not support standard.
          document.execCommand('Stop');
        }
      };
      /**
       * Parses the Requestr serialization data, and determines
       * any init steps to take.
       * @param {HTMLElement} serializationEl The element containing
       *     the serialization JSON data.
       */
      Requestr.parseSerialization = function(serializationEl) {
        // Parsing serialization data from document if specified.
        if (serializationEl &&
            (serializationEl.textContent || serializationEl.innerText)) {
          try {
            serializationEl = JSON.parse((serializationEl.textContent ||
                serializationEl.innerText));
          } catch (e) {
            Requestr.dispatchError(Requestr.customErrors.SERIALIZATION,
                'Invalid JSON string in serialization block.');
          }
          // Storing serialization data.
          Requestr.serialization = serializationEl;
          // Getting the location of the dataURI service.
          if (serializationEl && serializationEl.service) {
            // TODO (jam@): Add the capability of doing multiple
            // services (per domain).
            Requestr.service = serializationEl.service;
          } else {
            // Dispatching error since service is not defined.
            Requestr.dispatchError(Requestr.customErrors.SERIALIZATION,
                'An API end-point, "service", was not defined in the' +
                ' serialization block.');
          }
          // Getting expire 'header' for assets in cache.
          if (serializationEl && serializationEl.expires) {
            Requestr.cache.expires =
                (new Date(serializationEl.expires)).getTime();
          }
          // Dispatching Requestr ready event.
          window.dispatchEvent(new CustomEvent(
              Requestr.customEvents.REQUESTR_READY));
          // Checking for page to load or self.
          if (serializationEl && serializationEl.self) {
            // Loading self.
            Requestr.loadPage(window.location.href);
          } else if (serializationEl && serializationEl.owner) {
            // Loading external page.
            Requestr.loadPage(serializationEl.owner);
          }
          // Other load types could be handled here if needed.
        } else {
          // Dispatching error due to missing serialization block.
          Requestr.dispatchError(Requestr.customErrors.SERIALIZATION,
              'A Requestr serialization block was not found when' +
              ' parsing the document.');
        }
      };
      /**
       * Opens the local database used by Requestr to keep a cache of the
       * previously fetched resources.
       * @param {Number} version The version to use when opening database.
       * @param {Function=} opt_callback The method to call with the outcome
       *     success of getting a local database.
       */
      Requestr.openLocalDb = function(version, opt_callback) {
        // Operation handlers for database creation outcome.
        var callbackSuccess, callbackError;
        callbackSuccess = function() {
          // Making callback if specified.
          if (typeof opt_callback === 'function') {
            opt_callback(true);
          }
        };
        callbackError = function() {
          // Making callback if specified.
          if (typeof opt_callback === 'function') {
            opt_callback(false);
          }
        };
        // Creating appropiate database based on browser support.
        if (window.indexedDB) {
          // Creating reference to opening the database.
          var request = window.indexedDB.open(
              Requestr.CACHING_DB_NAME, version);
          // Error handling request.
          request.onerror = function(event) {
            // Dispatching error event with details.
            Requestr.dispatchError(Requestr.customErrors.CACHING,
                'Could not initiate database used for caching. ' +
                'More error information found in details.',
                event.target);
            // Making error callback.
            callbackError();
          };
          // Handling upgrade of database tables.
          request.onupgradeneeded = function(event) {
            // Creating table if not already present.
            if (!request.result.objectStoreNames.contains(
                Requestr.CACHING_DB_STORE_NAME)) {
              // Creating objectStore to keep blobs, to be used
              // when reload resolving.
              var objectStore = request.result.createObjectStore(
                  Requestr.CACHING_DB_STORE_NAME,
                  {keyPath: Requestr.CACHING_DB_STORE_KEY});
              // Indexing by url.
              objectStore.createIndex(Requestr.CACHING_DB_STORE_KEY,
                  Requestr.CACHING_DB_STORE_KEY, {unique: true});
              // No need to make callback, the onsuccess method
              // is still called after this is done.
            }
            // TODO (jam@): Add any dynamic handling needed.
          };
          // Handling success.
          request.onsuccess = function(event) {
            // Storing reference for usage.
            Requestr.localDb = request.result;
            // Making success callback.
            callbackSuccess();
          };
        } else if (Requestr.browser.isSafari) {
          // Polyfill for Safari 7.
          if (openDatabase) {
            // Creating WebSQL database.
            var db = Requestr.localDbPolyfill = openDatabase(
                Requestr.CACHING_DB_NAME,
                version,
                'Requestr WebSQL polyfill for IndexedDB',
                // TODO (jam@): Add capability to upgrade size on demand.
                Requestr.WEBSQL_DEFAULT_SIZE
                );
            // Checking to have gotten reference to database.
            if (db) {
              // Creating table or getting reference to already existing.
              db.transaction(function(tx) {
                // Creating table if not present.
                tx.executeSql(
                    'CREATE TABLE IF NOT EXISTS ' +
                    Requestr.CACHING_DB_STORE_NAME +
                    // This table must be manually maintained.
                    '(url TEXT PRIMARY KEY, token TEXT, mimeType TEXT, ' +
                    'dataType TEXT, data TEXT, date INT)',
                    [],
                    // Success creation or getting reference of database.
                    function(e) {
                      // Making success callback.
                      callbackSuccess();
                    },
                    // Error creation or getting reference of database.
                    function(e) {
                      // Making error callback.
                      callbackError();
                    }
                );
              });
            } else {
              // Making error callback.
              callbackError();
            }
          } else {
            // Making error callback.
            callbackError();
          }
        } else {
          // Dispatching error event.
          Requestr.dispatchError(Requestr.customErrors.CACHING,
              'User\'s browser does not support custom caching ' +
              'capabilities required by Requestr.');
          // Making error callback.
          callbackError();
        }
      };
      /**
       * Close the connection, otherwise we block other Requestr
       * instances from accessing the DB (even in other windows).
       */
      Requestr.closeLocalDb = function() {
        if (Requestr.localDb && Requestr.localDb.close) {
          Requestr.localDb.close();
          Requestr.localDb = null;
        }
      };
      /**
       * Updates the local cache with the new resources, overwrites
       * previous values if resource already in cache.
       * @param {Array.<Objects>} resources The array of resources
       *     to cache.
       */
      Requestr.cache.update = function(resources) {
        // Creating operation handlers.
        var handleSuccess, handleError;
        handleSuccess = function() {
          // TODO (jam@): Dispatch event.
        };
        handleError = function(error) {
          // Dispatching error event with details.
          Requestr.dispatchError(Requestr.customErrors.CACHING,
              'An error occured copying resource(s) to the cache.' +
              'More error information found in details.',
              error);
        };
        // Checking for database (including polyfills).
        if (window.indexedDB) {
          Requestr.openLocalDb(Requestr.CACHING_DB_VERSION, function(opened) {
            if (opened) {
              Requestr.cache.add(resources,
                  // Success on all entries.
                  handleSuccess,
                  // Error handler for any error per entry.
                  handleError);
            }
          });
        } else if (Requestr.browser.isSafari && Requestr.localDbPolyfill) {
          Requestr.cache.pollyfill.websql.add(resources,
              // Success on all entries.
              handleSuccess,
              // Error handler for any error per entry.
              handleError);
        }
      };
      /**
       * Adds/overwrites resources local cache in websql database pollyfill.
       * @param {Array.<Object>} resources The Array of resources to add.
       * @param {Function=} opt_onsuccess Success handler callback.
       * @param {Function=} opt_onerror Error handler callback.
       */
      Requestr.cache.pollyfill.websql.add = function(resources, opt_onsuccess,
          opt_onerror) {
        var totalCounter = 0, successCounter = 0, checkSuccess,
            handleSuccess, attempOverwrite, attempWrite;
        // Success handler for all resources.
        checkSuccess = function() {
          if (successCounter === totalCounter) {
            if (typeof opt_onsuccess === 'function') {
              opt_onsuccess();
            }
          }
        };
        // Handles checking for success async.
        handleSuccess = function(e) {
          successCounter++;
          checkSuccess();
        };
        // Updates entry by overwriting.
        attempOverwrite = function(resource) {
          // Creating transaction to insert or update resource.
          Requestr.localDbPolyfill.transaction(function(tx) {
            // Updating/overwriting entry in database.
            tx.executeSql('UPDATE ' +
                Requestr.CACHING_DB_STORE_NAME +
                ' SET url=?, token=?, mimeType=?, dataType=?, data=?, ' +
                'date=? WHERE url = "' + resource.url + '"',
                [resource.url, resource.token, resource.mimeType,
                  resource.dataType, resource.data, resource.date],
                // Success with new entry in cache.
                handleSuccess,
                // Error overwrite, real error as resource won't be cached.
                function(e) {
                  opt_onerror(e);
                }
            );
          });
        };
        // Creating transaction to insert or update resource.
        Requestr.localDbPolyfill.transaction(function(tx) {
          var r, currResource;
          // Adding/Updating resources in database.
          for (r in resources) {
            currResource = resources[r];
            totalCounter++;
            tx.executeSql('INSERT INTO ' +
                Requestr.CACHING_DB_STORE_NAME +
                '(url, token, mimeType, dataType, data, date) ' +
                    'VALUES (?,?,?,?,?,?)',
                [currResource.url, currResource.token, currResource.mimeType,
                  currResource.dataType, currResource.data,
                  currResource.date],
                // Success with new entry in cache.
                handleSuccess,
                // Error, attempting to overwrite manually.
                attempOverwrite.call(this, currResource)
            );
          }
        });
      };
      /**
       * Adds/overwrites resources local cache in database.
       * @param {Array.<Object>} resources The Array of resources to add.
       * @param {Function=} opt_onsuccess Success handler callback.
       * @param {Function=} opt_onerror Error handler callback.
       */
      Requestr.cache.add = function(resources, opt_onsuccess, opt_onerror) {
        var objectStore, r, currResource, requestSuccess, requestError,
            // Creating writable transaction reference to database.
            transaction = Requestr.localDb.transaction(
            [Requestr.CACHING_DB_STORE_NAME], 'readwrite');
        // Creating reference to store in database.
        objectStore = transaction.objectStore(
            Requestr.CACHING_DB_STORE_NAME);
        // Success handler upon all resources are added to database.
        transaction.oncomplete = function(event) {
          if (typeof opt_onsuccess === 'function') {
            opt_onsuccess(event);
          }
          // Closing instance of indexedDb.
          Requestr.closeLocalDb();
        };
        // Error handler.
        transaction.onerror = function(event) {
          if (typeof opt_onerror === 'function') {
            opt_onerror(event);
          }
          // Closing instance of indexedDb.
          Requestr.closeLocalDb();
        };
        // Removing resource from list upon success.
        requestSuccess = function(event) {
          delete resources[event.target.result];
        };
        // Throw error if not added to database.
        requestError = function(event) {
          // Dispatching error event with details.
          Requestr.dispatchError(Requestr.customErrors.CACHING,
              'An error occured copying resource(s) to the cache.' +
              'More error information found in details.',
              event.target.error);
        };
        // Adding each resource to database.
        for (r in resources) {
          currResource = resources[r];
          // Checking for valid url to add as key entry.
          if (currResource.url) {
            // Using put to overwrite previous entries to allow updating.
            var request = objectStore.put(currResource);
            // Adding operation outcome handlers.
            request.onsuccess = requestSuccess;
            request.onerror = requestError;
          }
        }
      };
      /**
       * Gets array of cached requests in Requestr's polyfill local
       * database.
       * @param {Array.<Object>} requests The requests to attempt to
       *     resolve in local Requestr database cache.
       * @param {Function=} opt_callback The handler to call when cache
       *     is fetched.
       */
      Requestr.cache.pollyfill.websql.read = function(requests, opt_callback) {
        var i, url, length = requests.length, counter = 0, cached = [],
            resolveReadFiles, requestSuccess, requestError, currResult;
        // Makes callback once all requests are attempted to be resolved
        // against the local cache.
        resolveReadFiles = function() {
          if (counter === length) {
            // Storing the fetched requests from cache for easier access.
            Requestr.resourcesFetchedFromCache =
                Requestr.resourcesFetchedFromCache.concat(cached);
            // Making callback if specified.
            if (typeof opt_callback === 'function') {
              opt_callback(cached);
            }
          }
        };
        // Success hanlder for each request.
        requestSuccess = function(tx, results) {
          counter++;
          // Checking for error, might not have any matches.
          if (results.rows.length) {
            cached.push(results.rows.item(0));
          }
          resolveReadFiles();
        };
        // Error handler for each request.
        requestError = function(event) {
          counter++;
          resolveReadFiles();
        };
        // Adding resources to database for caching.
        Requestr.localDbPolyfill.transaction(function(tx) {
          // Checking for valid url as it's used as the main key.
          for (i = 0; (url = (requests[i] ? requests[i].Url : null)); i++) {
            if (url) {
              // Attempting to lookup resource by url in table.
              tx.executeSql('SELECT * FROM ' +
                  Requestr.CACHING_DB_STORE_NAME + ' WHERE url=?', [url],
                  // Success handler for lookup.
                  requestSuccess,
                  // Error handler for lookup.
                  requestError
              );
            }
          }
        });
      };
      /**
       * Gets array of cached requests in Requestr's local database.
       * @param {Array.<Object>} requests The requests to attempt to
       *     resolve in local Requestr database cache.
       * @param {Function=} opt_callback The handler to call when cache
       *     is fetched.
       */
      Requestr.cache.read = function(requests, opt_callback) {
        var objectStore, length, counter, i, url, cached = [],
            transaction, resolveReadFiles, requestSuccess, requestError;
        // Makes callback once all requests are attempted to
        // be resolved against the local cache.
        resolveReadFiles = function() {
          if (counter === length) {
            // Storing the fetched requests from cache for easier access.
            Requestr.resourcesFetchedFromCache =
                Requestr.resourcesFetchedFromCache.concat(cached);
            // Making callback if specified.
            if (typeof opt_callback === 'function') {
              opt_callback(cached);
            }
            // Closing instance of indexedDb.
            Requestr.closeLocalDb();
          }
        };
        // Success hanlder for each request.
        requestSuccess = function(event) {
          counter++;
          cached.push(event.target.result);
          resolveReadFiles();
        };
        // Error handler for each request.
        requestError = function(event) {
          counter++;
          resolveReadFiles();
        };
        // Checking for local database to be present.
        if (window.indexedDB) {
          Requestr.openLocalDb(Requestr.CACHING_DB_VERSION, function(opened) {
            if (opened && Requestr.localDb &&
                Requestr.localDb.objectStoreNames.length) {
              // Creating transaction reference, read only.
              transaction = Requestr.localDb.transaction(
                  [Requestr.CACHING_DB_STORE_NAME]);
              // Creating store reference to read.
              objectStore = transaction.objectStore(
                  Requestr.CACHING_DB_STORE_NAME);
              // Looking at each request and attempting to resolve.
              for (i = 0, counter = 0, length = requests.length;
                  (url = requests[i] ? requests[i].Url : null);
                  i++) {
                // Checking for valid url before reading locally.
                if (url) {
                  // Creating request to fetch resource.
                  var request = objectStore.get(url);
                  // Adding operation handlers.
                  request.onsuccess = requestSuccess;
                  request.onerror = requestError;
                }
              }

            } else {
              opt_callback([]);
            }
          });
        } else if (Requestr.browser.isSafari && Requestr.localDbPolyfill) {
          // Using WebSQL polyfill.
          Requestr.cache.pollyfill.websql.read(requests, opt_callback);
        } else {
          // No caching supported or available at the moment.
          opt_callback([]);
        }
      };
      /**
       * Removes the specified url(s) from the local cache.
       * @param {Array.<string>} urls The absolute urls to resolve
       *     and remove from Requestr's local cache.
       * @param {Function=} opt_callback The handler for operation outcome.
       */
      Requestr.cache.remove = function(urls, opt_callback) {
        // TODO (jam@): Add missing functionality. Determing if
        // this is needed, since new resources overwrite the cache.
        console.log('Error: Removing resources from Requestr ' +
            'cache not currently supported.');
      };
      /**
       * Clears the entire local cache for Requestr.
       * @param {Function=} opt_callback The handler for operation outcome.
       */
      Requestr.cache.clear = function(opt_callback) {
        // TODO (jam@): Should probably issue a warning or ask for
        // confirmation. Also add callback functionality.
        if (window.indexedDB) {
          Requestr.openLocalDb(Requestr.CACHING_DB_VERSION, function(opened) {
            if (opened) {
              window.indexedDB.deleteDatabase(Requestr.CACHING_DB_NAME);
            }
            // Closing instance of indexedDb.
            Requestr.closeLocalDb();
          });
        } else if (Requestr.browser.isSafari && Requestr.localDbPolyfill) {
          // Only delete tables is supported with WebSQL.
          Requestr.localDbPolyfill.transaction(function(tx) {
            tx.executeSql('DROP TABLE ' + Requestr.CACHING_DB_STORE_NAME);
          });
        }
      };
      /**
       * Parses an HTML fragment for assets, and resolves the URLs.
       * @param {string} source The location URI to resolve URLs against.
       * @param {string} html The HTML string to parse.
       * @param {Function} callback The handler for the operation, will
       *     receive an HTML string when successful, and null for failure.
       */
      Requestr.loadFragment = function(source, html, callback) {
        // Creating in memory document to do parsing.
        var base, dimp =
            window.document.implementation.createHTMLDocument('');
        // Adding a base element to use in resolving URLs.
        base = dimp.createElement('base');
        base.setAttribute('href', source);
        dimp.head.appendChild(base);
        dimp.body.innerHTML = html;
        // Parsing document for URLs.
        Requestr.parsePage(
            {originUrl: source, target: {response: dimp}},
            function(result) {
              // Checking for content.
              if (result.html) {
                // Creating in memory document to get resolved HTML.
                dimp = window.document.implementation.createHTMLDocument('');
                dimp.documentElement.innerHTML = result.html;
                if (typeof callback === 'function') {
                  callback(dimp.body.innerHTML);
                }
                dimp = null;
              } else {
                if (typeof callback === 'function') {
                  callback(null);
                }
              }
            }, null, null, true);
      };
      /**
       * Loads a page from URL provided and parses assets' URLs.
       * If a callback is defined, the page is loaded in memory as a
       * blob URL.
       * @param {string} pageUrl The url of the page to load into
       *     main window.
       * @param {Function=} opt_callback The callback to send the blob
       *     URL of the parsed page.
       * @param {Number=} opt_expires The expire time for the cached resources
       *     in milliseconds, compared to entry in local database. Defaults
       *     to the value in serialization or none if not specified.
       * @param {Object=} opt_mutator HTML strings to inject into the document
       *     before it is parsed. Consists of head or body with before or
       *     after HTML strings.
       */
      Requestr.loadPage = function(pageUrl, opt_callback,
          opt_expires, opt_mutator) {
        // Checking for a defined expiration time.
        opt_expires = opt_expires || Requestr.cache.expires;
        // Adding class to allow for styling.
        document.documentElement.classList.add(Requestr.LOADING_CLASS);
        // Only stops window from loading when replace same window document.
        if (typeof opt_callback !== 'function') {
          Requestr.stopWindow();
        }
        // Dispatching event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.DOCUMENT_LOAD_START);
        // Using the browser to resolve the URL.
        var url = document.createElement('a');
        url.setAttribute('href', pageUrl);
        url = url.href;
        // Checking for service, otherwise should throw error.
        if (Requestr.service) {
          // Using the Backend API to bypass cross-domain should
          // CORS not be enabled in the server hosting the page.
          Requestr.requestDataUriFromService(Requestr.service, [{
            Url: url,
            Document: true,
            Token: null,
            Type: 'STRING'
          }], {
            load: function(e) {
              var resource = e.target.response, cachedDoc;
              // If JSON response is not supported by browser.
              if (typeof resource !== 'object') {
                resource = JSON.parse(resource);
              }
              // Checking for proper response from API.
              if (resource && (resource = resource.Resources) &&
                  (resource = resource[0])) {
                // Checking for request to contain data, if not
                // fetching from cache.
                if (resource.Data) {
                  // Adding page to the cache.
                  Requestr.resourcesToCache[resource.Url] = {
                    // TODO (jam@): Make single method, used here and in
                    // resources.
                    url: resource.Url,
                    mimeType: resource.ContentType,
                    dataType: resource.Type,
                    token: resource.Token,
                    date: Date.now(),
                    data: resource.Data
                  };
                } else if (resource && (cachedDoc =
                    Requestr.xhr.cachedDocument)) {
                  // Getting cached data, service did not return any
                  // new data.
                  resource.Data = cachedDoc.data;
                  resource.Type = cachedDoc.dataType;
                } else {
                  // TODO (jam@): Add error handling if determined needed.
                  resource.Data = '';
                }
                // Creating in-memory document for URL resolving.
                var base, parser = new DOMParser(), doc, dimp =
                    window.document.implementation.createHTMLDocument('');
                // TODO (jam@): Remove, this is a temporary fix due to the
                // API returning odd mime-types with encoding which
                // is invalid.
                if (resource.ContentType.indexOf(';')) {
                  resource.ContentType = 'text/html';
                }
                // Setting in-memory document with loaded data.
                doc = parser.parseFromString(resource.Data,
                    resource.ContentType);
                // TODO (jam@): Figure out why DOMParser is not working
                // on all browsers.
                if (!doc) {
                  doc =
                      window.document.implementation.createHTMLDocument('');
                  doc.documentElement.innerHTML = resource.Data;
                  // TODO (jam@): Add fallback to copy documentElement
                  // attributes.
                  console.log('Warning: This browser does not support ' +
                      'DOMParser fully, documentElement will not inherit ' +
                      'original attributes.');
                }
                // Checking for base element to be present, otherwise need
                // to specify to pass URL resolving to the browser.
                if ((base = doc.getElementsByTagName('base')).length === 0) {
                  base = doc.createElement('base');
                  // Since there isn't a base element, adding one with
                  // the determined URL.
                  base.setAttribute('href', url);
                  // TODO (jam@): File bug against Firefox, base element
                  // only resolves requests made after it's occurance in
                  // the DOM.
                  doc.head.insertBefore(base, doc.head.firstChild);
                }
                // When resolving on a cross-domain, the DOM Implementation
                // does not resolve CSS urls, so must re-init with base
                // elements added. This could be a bug, since the content
                // should not be loaded, so querying for the value should
                // be resolved according to the base element.
                dimp.documentElement.innerHTML =
                    doc.documentElement.outerHTML;
                // Copying attributes since documentElement is read only.
                Requestr.duplicateElementAttributes(
                    doc.documentElement, dimp.documentElement);
                // Reusing method, manually configuring parameters.
                Requestr.parsePage({
                  originUrl: url,
                  target: {response: dimp}
                },
                opt_callback, opt_expires, opt_mutator);
              } else {
                // Dispatching error event.
                Requestr.dispatchError(Requestr.customErrors.SERVICE,
                    'Service API did not return a document.');
                // TODO (jam@): Temporary fix to allow timeouts to resolve.
                opt_callback(null);
              }
            },
            // TODO (jam@): Improve error handling, and add progress.
            error: (opt_callback || Requestr.pageLoadError),
            progress: null,
            abort: (opt_callback || Requestr.pageLoadAbort)
            // TODO (jam@): The API should have a wildcard so that all
            // documents are loaded using it no matter file size. Using
            // this as an arbitrary number at the moment.
          }, null, opt_expires, 2000000);
        } else {
          // Dispatching error event.
          Requestr.dispatchError(Requestr.customErrors.SERVICE,
              'Unable to load document due to no service API specified.');
          // TODO (jam@): Add error handling or a way to allow
          // CORS page loading.
        }
      };
      /**
       * Dispatches a progress event for the document being loaded.
       * @param {Event} progress The progress event for the XHR of the
       *     document.
       */
      Requestr.pageLoadProgress = function(progress) {
        // Dispatching event, including load percentage.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.DOCUMENT_LOAD_PROGRESS, {
              progress: Math.round(progress.loaded / progress.totalSize * 100),
              bytes: progress.loaded,
              total: progress.totalSize
            }
        );
      };
      /**
       * Dispatches an error event for the document being loaded.
       * @param {Event} error The error event for the XHR of the document.
       */
      Requestr.pageLoadError = function(error) {
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.DOCUMENT_LOAD_ERROR, {
              error: error
            });
      };
      /**
       * Dispatches an error event for the document being loaded.
       * @param {Event} abort The error event for the XHR of the document.
       */
      Requestr.pageLoadAbort = function(abort) {
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.DOCUMENT_LOAD_ERROR, {
              error: abort
            });
      };
      // TODO (jam@): Make the expires, mutator, and fragment paramaters
      // in parsePage into a single optional configuration object for
      // better notation. This should be broken into a few appropiate
      // methods for more detailing and better testing.
      /**
       * Parses a HTML document fully, as in a page.
       * @param {Event} request The XHR document typed request.
       * @param {Function=} opt_callback Optional callback for when parsing
       *     is completed.
       * @param {string=} opt_expires Optional expire date for
       *     embedded requests.
       * @param {Object=} opt_mutator HTML strings to inject into the document
       *     before it is parsed. Consists of head or body with before or
       *     after HTML strings.
       * @param {boolean=} opt_fragment Flag to determine if content is a
       *     document or an HTML fragment.
       */
      Requestr.parsePage = function(request, opt_callback, opt_expires,
          opt_mutator, opt_fragment) {
        var ownerDoc;
        // Only parsing page if service is available.
        if (Requestr.service) {
          // Dispatching load complete event.
          Requestr.dispatchCustomEvent(
              Requestr.customEvents.DOCUMENT_LOAD_COMPLETE);
          // Getting expire time if specified for resolving cache.
          opt_expires = opt_expires ||
              (Requestr.xhr ? Requestr.xhr.documentExpires : null);
          // Getting the document from the XHR, response is document typed.
          ownerDoc = Requestr.ownerDocument = request.target.response;
          // Workaround for IE.
          if (Requestr.browser.ieInternetExplorer) {
            ownerDoc.ieURL = request.originUrl;
          }
          /* TODO (jam@): Determine optimal process for injecting content.
           * This should be astracted more and offer more options, such
           * as injections by element targeting or parsing/transforming.
           */
          // Add HTML injection before parsing, so should be absolute URLs.
          if (opt_mutator) {
            // Checking for mutators to be in the head.
            if (opt_mutator.head) {
              // Adding injection before head content.
              if (opt_mutator.head.before) {
                ownerDoc.head.innerHTML = opt_mutator.head.before +
                    ownerDoc.head.innerHTML;
              }
              // Adding injection after head content.
              if (opt_mutator.head.after) {
                ownerDoc.head.innerHTML = ownerDoc.head.innerHTML +
                    opt_mutator.head.after;
              }
            }
            // Checking for mutators to be in the body.
            if (opt_mutator.body) {
              // Adding injection before body content.
              if (opt_mutator.body.before) {
                ownerDoc.body.innerHTML =
                    opt_mutator.body.before +
                    ownerDoc.body.innerHTML;
              }
              // Adding injection after body content.
              if (opt_mutator.body.after) {
                ownerDoc.body.innerHTML =
                    ownerDoc.body.innerHTML +
                    opt_mutator.body.after;
              }
            }
          }
          // Initializing local variables.
          var i, j, length, jLength, currEl, requestUrls = [], baseEl,
              elementToRemove, styleCssString, styleCssUrls,
              manualUrlResolve, requestingElements =
                  ownerDoc.querySelectorAll(Requestr.ELEMENTS_QUERY),
              originUrl = (Requestr.browser.ieInternetExplorer ?
                  ownerDoc.ieURL : ownerDoc.URL);
          // Getting URL assets to resolve from elements making requests.
          for (i = 0, length = requestingElements.length;
              (currEl = requestingElements[i]); i++) {
            // Building list of URL requests to combine server side.
            // Filtering by allowed node list.
            if (Requestr.urlParsingEnabledElement[currEl.nodeName]) {
              // CSS link element, not icon or other.
              if (currEl.nodeType === 1 && (currEl.nodeName === 'LINK') &&
                  (/(?:^| )stylesheet(?:\/less)?(?:$| )/i.test(
                  currEl.rel)) && currEl.href) {
                // CSS is requested as strings to allow faster
                // client-side parsing.
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
              // TODO (jam@): Improve this, currently asserting all
              // elements have absolute paths as the parsing relies on
              // such value (server).
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
          if ((baseEl = ownerDoc.getElementsByTagName(
              'base')).length === 0) {
            baseEl = ownerDoc.createElement('base');
            baseEl.setAttribute('href', originUrl);
            // TODO (jam@): File bug against Firefox, base element only
            // resolves requests made after it's occurance in the DOM.
            ownerDoc.head.insertBefore(baseEl, ownerDoc.head.firstChild);
          }
          // Removing serialization element since no longer needed.
          if ((elementToRemove = ownerDoc.querySelector(
              Requestr.SERIALIZATION_QUERY))) {
            elementToRemove.parentNode.removeChild(elementToRemove);
          }
          // Removing Requestr script element since no longer neded.
          if ((elementToRemove = ownerDoc.querySelector(
              '[' + Requestr.JS_ELEMENT_ATTRIBUTE + ']'))) {
            elementToRemove.parentNode.removeChild(elementToRemove);
          }
          // Parsing style elements for URLs in CSS rules.
          requestingElements = ownerDoc.getElementsByTagName('style');
          for (i = 0, length = requestingElements.length;
              (currEl = requestingElements[i]); i++) {
            // TODO (jam@): Firefox bug was filed, but will most likely
            // need to implement fix.
            // Firefox Issue Reference:
            // https://bugzilla.mozilla.org/show_bug.cgi?id=925493
            if (currEl.sheet && !Requestr.browser.isFirefox &&
                !Requestr.browser.ieInternetExplorer) {
              // Getting CSS string with resolved URLs.
              styleCssString = Requestr.getParsedCssFromRules(
                  currEl.sheet.rules);
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
              manualUrlResolve = {Url: originUrl, Data: styleCssString};
              // Getting URLs from CSS string.
              styleCssUrls = Requestr.parseCssResourcesForUrls(
                  [manualUrlResolve]);
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
          Requestr.documentString = ownerDoc.documentElement.outerHTML;
          // TODO (jam@): Improve, this is bad, should be better way to
          // keep reference.
          if (Requestr.xhr && Requestr.xhr.blobUrlCallback) {
            opt_callback = Requestr.xhr.blobUrlCallback;
          }
          /*
           * Requesting all HTTP requests via a single request from the
           * server. The requests are returned as a dataURI array, which
           * we then turn into a blob and URL object that replaces the
           * original URL.
           */
          Requestr.requestDataUriFromService(Requestr.service, requestUrls, {
            load: Requestr.handleResponseResources,
            error: Requestr.handleResponseResourcesError,
            progress: Requestr.handleResponseResourcesProgress,
            abort: Requestr.handleResponseResourcesAbort,
            fragment: opt_fragment
          }, opt_callback, opt_expires);
          // Dispatching load start event.
          Requestr.dispatchCustomEvent(
              Requestr.customEvents.RESOURCE_LOAD_START);
        } else {
          // Dispatching error event.
          Requestr.dispatchError(Requestr.customErrors.SERVICE,
              'Unable to load requested data due to no service API specified.');
        }
      };
      /**
       * Attempts to find the matching resource in list by url.
       * @param {Array.<Object>} list The array to filter for the url.
       * @param {string} url The url to use when filtering.
       * @return {Object} The matching object in the list.
       */
      Requestr.getMatchingObjectWithUrl = function(list, url) {
        return list.filter(function(obj) {
          return obj ? (obj.url === url) : null;
        })[0];
      };
      // TODO (jam@): Add a timeout when reading from cache (error).
      /**
       * Fetches an array of URLs as data URIs from a service.
       * @param {string} service The location of the data URI API.
       * @param {Array.<string>} urls Array of urls to fetch from server.
       * @param {Object} handler Object containing event handling methods
       *     for status.
       * @param {Function=} opt_callback Optional method stores in XHR for
       *     handlers.
       * @param {string=} opt_expires The expiration time for the requests
       *     to validate cache.
       * @param {Number=} opt_maxFileSizeOverWrite Optional max file size
       *     to overwrite defaults.
       */
      Requestr.requestDataUriFromService = function(service, urls, handler,
          opt_callback, opt_expires, opt_maxFileSizeOverWrite) {
        // Checking for request tokens in Requestr's cache.
        Requestr.cache.read(urls, function(cached) {
          var i, j, match, exclude, allow, length, currResource,
              allowed, filtered = [], xhr;
          // XHR request to the service to get data URIs.
          xhr = Requestr.xhr = new XMLHttpRequest();
          xhr.open('POST', service, true);
          xhr.setRequestHeader('Content-type', 'application/json');
          xhr.setRequestHeader('Accept', 'application/json');
          // Passing callback if defined.
          if (opt_callback) {
            xhr.blobUrlCallback = opt_callback;
          }
          // Checking for expires, used to validate local cache.
          if (opt_expires) {
            xhr.documentExpires = opt_expires;
          }
          // TODO (jam@): Remove when properly supported by all browsers.
          // Avoiding a browser error if not supported.
          try {
            xhr.responseType = 'json';
          } catch (error) {
            // TODO (jam@): Add any error handling if needed, shouldn't
            // be at this point.
          }
          // Adding XHR status event handlers.
          if (handler) {
            if (typeof handler.load === 'function') {
              xhr.addEventListener('load', handler.load, true);
            }
            if (typeof handler.error === 'function') {
              xhr.addEventListener('error', handler.error, true);
            }
            if (typeof handler.progress === 'function') {
              xhr.addEventListener(
                  'progress', handler.progress, true);
            }
            if (typeof handler.abort === 'function') {
              xhr.addEventListener('abort', handler.abort, true);
            }
            if (handler.fragment) {
              xhr.blobUrlFragment = true;
            }
          }
          // Checking for URL filters.
          if (Requestr.serialization) {
            // Checking for URL allowed list.
            if (Array.isArray(Requestr.serialization.allow)) {
              allow = Requestr.serialization.allow;
            }
            // Checking for URL exclusion list.
            if (Array.isArray(Requestr.serialization.exclude)) {
              exclude = Requestr.serialization.exclude;
            }
          }
          // Cache checking and URL filtering before making request.
          for (i = 0; (currResource = urls[i]); i++) {
            // TODO (jam@): Implement more optimal way to filter.
            if (allow) {
              for (j = 0, length = allow.length; j < length; j++) {
                // Checking to see if URL is allowed.
                if (currResource.Url.indexOf(allow[j]) === 0) {
                  allowed = true;
                  j = length;
                }
              }
              // Removing from list if not allowed.
              if (!allowed && !currResource.Document) {
                currResource.Url = '';
              }
            }
            // Checking for URL to be in exclusion list.
            if (exclude) {
              for (j = 0, length = exclude.length; j < length; j++) {
                // Removing request if in exclusion list.
                if (currResource.Url.indexOf(exclude[j]) === 0) {
                  if (!currResource.Document) {
                    currResource.Url = '';
                  }
                  j = length;
                }
              }
            }
            // Checking local cache, doing any resolving if applicable.
            if (currResource.Url !== '') {
              // Finding cached resources, and getting token.
              match = Requestr.getMatchingObjectWithUrl(
                  cached, currResource.Url);
              if (match) {
                // Checking for cache validity, does not fetch is valid.
                if (match.date < opt_expires) {
                  currResource.Url = '';
                }
                // Setting token if found in cache.
                currResource.Token = match.token;
                // Storing cached document for resolving if still valid.
                if (currResource.Document) {
                  xhr.cachedDocument = match;
                }
              }
            }
            // Removing property that is not needed by API.
            if (currResource.Document) {
              delete currResource.Document;
            }
          }
          // TODO (jam@): Obviously this is unoptimized and for-looping
          // hell, need to implement a proper filtering method.
          for (i = 0; (currResource = urls[i]); i++) {
            if (currResource.Url !== '') {
              filtered.push(currResource);
            }
          }
          // Checking if any requests need to be fetched from server.
          if (filtered.length) {
            // Sending request for URI data.
            xhr.send(JSON.stringify({
              MaxSize: opt_maxFileSizeOverWrite || (Requestr.serialization ?
                  Requestr.serialization.maxFileSize : null) ||
                  Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE,
              // Tokens are used to validate cache server-side.
              Urls: filtered
            }));
          } else {
            // Gathering catched resources for resolving.
            filtered = [];
            for (i = 0, length = cached.length; i < length; i++) {
              if ((currResource = cached[i])) {
                // TODO (jam@): Might be best to update the cache table to
                // match the original properties and avoid this loop.
                filtered.push({
                  Url: currResource.url,
                  Type: currResource.dataType,
                  Data: currResource.data,
                  ContentType: currResource.mimeType
                });
              }
            }
            // Manually calling load method since all assets are cached.
            if (typeof handler.load === 'function') {
              handler.load({target: {response: {Resources: filtered}}});
            }
            // Forcing garbage collection.
            cached = filtered = null;
          }
        });
      };
      /**
       * Conducts a nested level of parsing for requests made in any
       * CSS string, meaning style or link elements or inline styles.
       * @param {CSSRuleList} rules The array of CSS rules.
       * @return {string=} The string of all the CSS rules.
       */
      Requestr.getParsedCssFromRules = function(rules) {
        if (rules) {
          var i, length = rules.length, css = '';
          for (i = 0; i < length; i++) {
            // This returns the same CSS with resolved URLs.
            css += rules[i].cssText;
          }
          return css;
        } else {
          return null;
        }
      };
      /**
       * Gets the URLs embedded in a CSS string.
       * @param {string} css A string containing CSS definitions.
       * @return {Array=} Returns an array of the URLs in the CSS or
       *     null if none.
       */
      Requestr.getUrlsFromCssString = function(css) {
        // Getting array of URLs in the CSS string.
        var styleCssUrls = css.match(/url\(()(.+?)\1\)/gi);
        // Checking to see if we have some URLs in the CSS before
        // validating.
        if (Array.isArray(styleCssUrls)) {
          // Getting actual URLs from CSS value array.
          styleCssUrls =
              styleCssUrls.toString().match(Requestr.matchUrlPattern);
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
          Requestr.xhr.removeEventListener('load',
              Requestr.handleResponseResources, true);
          Requestr.xhr.removeEventListener('error',
              Requestr.handleResponseResourcesError, true);
          Requestr.xhr.removeEventListener('progress',
              Requestr.handleResponseResourcesProgress, true);
          Requestr.xhr.removeEventListener('abort',
              Requestr.handleResponseResourcesAbort, true);
        }
      };
      /**
       * Gets the response resources data and created blob URLs
       * and replaces URLs in document with such.
       * @param {Event} request The XHR response with the URI data.
       */
      Requestr.handleResponseResources = function(request) {
        // Dispatching complete event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.RESOURCE_LOAD_COMPLETE);
        // Cleaning up listeners to recycle xhr.
        Requestr.removeResponseLoadXhrListener();
        // Fix for browsers not supporting json responseType XHRs.
        if (typeof request.target.response !== 'object') {
          // TODO (jam@): Removed when IE supports it.
          request = JSON.parse(request.target.response);
        } else {
          request = request.target.response;
        }
        // Getting array of files as URIs or alternate result(s).
        var dataSet = request, styleEls, i, cssUrls, match,
            docString = Requestr.documentString, cssResources = [],
            sourceSet = dataSet.Resources, currSource,
            dimp = window.document.implementation.createHTMLDocument(''),
            callback = Requestr.xhr.blobUrlCallback,
            fragment = Requestr.xhr.blobUrlFragment,
            expires = Requestr.xhr.documentExpires;
        // TODO (jam@): Add error details.
        if (!dataSet.Resources) {
          // Dispatching error event.
          Requestr.dispatchCustomEvent(
              Requestr.customEvents.RESOURCE_API_ERROR);
        }
        // Creating DOMImplementation for URL parsing via DOM query
        // selectors.
        dimp.documentElement.innerHTML = docString;
        // Dispatching resolving resources event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.RESOURCE_RESOLVING);
        // Getting style elements to parse CSS strings for URLs
        styleEls = dimp.getElementsByTagName('style');
        // Creating urls from blobs and replacing the HTML string value
        // with blob's.
        if (sourceSet) {
          for (i = 0; (currSource = sourceSet[i]); i++) {
            // Checks resource against cache.
            if (!currSource.Type) {
              // Attempting to find match.
              match = Requestr.getMatchingObjectWithUrl(
                  Requestr.resourcesFetchedFromCache, currSource.Url);
              //
              if (match) {
                currSource.Type = match.dataType;
                currSource.Data = match.data;
                currSource.ContentType = match.mimeType;
              } else {
                // Dispatching error event.
                Requestr.dispatchError(Requestr.customErrors.CACHING,
                    'Unable to resolve resource from cache, resource will not' +
                    ' be loaded via Requestr, it will make network request.');
              }
            }
            // Resolving resource with blob URL.
            if (currSource.ContentType === 'text/css' &&
                currSource.Type === 'STRING') {
              // CSS resources are treated for a second level parsing.
              cssResources.push(currSource);
            } else {
              Requestr.replaceDocumentUrlsWithBlob(
                  currSource, dimp, styleEls);
            }
          }
          // Getting all resolved URLs from all external CSS.
          cssUrls = Requestr.parseCssResourcesForUrls(cssResources);
        }
        // Checks if external CSS needs additional parsing, otherwise
        // completes document.
        if ((cssResources.length > 0) && (cssUrls && cssUrls.length > 0)) {
          Requestr.loadExternalCssUrls(
              cssUrls, cssResources, expires, dimp, styleEls, function() {
                Requestr.completeResolvingDocument(
                    dimp, Requestr.ownerDocument, callback, fragment);
              });
        } else if (cssResources.length > 0) {
          // TODO (jam@): Improve, should do better job at handle statement.
          Requestr.loadExternalCssUrls(
              [], cssResources, expires, dimp, styleEls, function() {
                Requestr.completeResolvingDocument(
                    dimp, Requestr.ownerDocument, callback, fragment);
              });
        } else {
          Requestr.completeResolvingDocument(
              dimp, Requestr.ownerDocument, callback, fragment);
        }
        // Cleaning up.
        Requestr.xhr = null;
      };
      /**
       * Dispatches a progress event for the resources being loaded.
       * @param {Event} progress The progress event for the XHR of
       *     the resources.
       */
      Requestr.handleResponseResourcesProgress = function(progress) {
        // Dispatching bytes loaded event since can't get size.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.RESOURCE_LOAD_PROGRESS, {
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
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.RESOURCE_LOAD_ERROR, {
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
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.RESOURCE_LOAD_ERROR, {
              error: error
            });
        /*
         * TODO (jam@): If API is down, we can make all the requests
         * just once individually and still store as blob URLs for
         * subsequent requests.
         */
        Requestr.setDocumentHtml(
            Requestr.ownerDocument, Requestr.documentString);
      };
      /**
       * Completes the document parsing cycle and call proper
       * complete method.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed
       *     document.
       * @param {HTMLDocument} owner The original document loaded via XHR.
       * @param {Function=} opt_callback Optional callback method, if
       *     not defined the window.document is replaced otherwise
       *     a blob URL passed.
       * @param {boolean=} opt_fragment Flag to determine if content is a
       *     document or an HTML fragment.
       */
      Requestr.completeResolvingDocument = function(
          dimp, owner, opt_callback, opt_fragment) {
        // Checking whether to load document in memory or replace current.
        if (!opt_callback || typeof opt_callback !== 'function') {
          // Loading the document from parsed string.
          Requestr.setDocumentHtml(owner, dimp.documentElement.outerHTML);
        } else {
          // Creating window.URL from document.
          Requestr.createDocumentBlobUrl(
              dimp, owner, opt_callback, opt_fragment);
          // Removing class that allowed styling.
          document.documentElement.classList.remove(Requestr.LOADING_CLASS);
        }
        // Saving blobs to Requestr maintained cache (if supported).
        Requestr.cache.update(Requestr.resourcesToCache);
      };
      /**
       * Loads the requests in external CSS fetched from the service.
       * @param {Array.<string>} urls The array of URLs to fetch.
       * @param {Array.<Object>} css The resource objects containing CSS
       *     previously fetched from the service.
       * @param {?string} expires The expiration time for resources.
       * @param {HTMLDocument} dimp The DOM Implementation of the parsed
       *     document.
       * @param {Array.<StyleElement>} styles Array of style elements
       *     in dimp.
       * @param {Function=} opt_callback Optional callback method upon complete.
       */
      Requestr.loadExternalCssUrls = function(
          urls, css, opt_expires, dimp, styles, opt_callback) {
        // TODO (jam@): Improve the parameters needed, just prototyping now.
        var i, currUrl, length = urls.length, externalRequests = [],
            requestUrls;
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
        // Resolving CSS URLs or making service request for additonal
        // resources.
        if (externalRequests.length === 0) {
          // Does not contain additional external assets.
          Requestr.resolveDocumentCssUrls(css, dimp, styles, opt_callback);
        } else {
          // Loading external CSS requests.
          Requestr.requestDataUriFromService(
              Requestr.service, externalRequests, {
                progress: Requestr.handleExternalCssResourcesProgress,
                load: function(requests) {
                  Requestr.handleDocumentCssUris(
                      requests, css, dimp, styles, opt_callback);
                },
                error: function(error) {
                  Requestr.handleExternalCssResourcesError(error);
                  Requestr.resolveDocumentCssUrls(
                      css, dimp, styles, opt_callback);
                },
                abort: function(error) {
                  Requestr.handleExternalCssResourcesError(error);
                  Requestr.resolveDocumentCssUrls(
                      css, dimp, styles, opt_callback);
                }
              }, null, opt_expires);
          // Dispatching start event.
          Requestr.dispatchCustomEvent(
              Requestr.customEvents.EXTERNAL_CSS_LOAD_START);
        }
      };
      /**
       * Dispatches a progress event for the embedded css resources
       * being loaded.
       * @param {Event} progress The progress event for the XHR of
       *     the resources.
       */
      Requestr.handleExternalCssResourcesProgress = function(progress) {
        // Dispatching css loading progress event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.EXTERNAL_CSS_LOAD_PROGRESS, {
              bytes: Math.round(progress.loaded)
            });
      };
      /**
       * Dispatches an error event for the embedded css resources being
       * loaded.
       * @param {Event} error The error event for the XHR of the resources.
       */
      Requestr.handleExternalCssResourcesError = function(error) {
        // Dispatching error event, including error details.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.EXTERNAL_CSS_LOAD_ERROR, {
              error: error
            });
      };
      /**
       * Creates URLs from data URIs and parses CSS in recursion.
       * @param {Event} requests The XHR JSON typed request.
       * @param {Array.<Object>} css The resource objects containing CSS
       *     previously fetched from the service.
       * @param {HTMLDocument} dimp The DOM Implementation of the
       *     parsed document.
       * @param {Array.<StyleElement} styles Array of style elements
       *     in dimp.
       * @param {Function=} opt_callback Optional callback method upon complete.
       */
      Requestr.handleDocumentCssUris = function(
          requests, css, dimp, styles, opt_callback) {
        // Dispatching complete event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE);
        // TODO (jam@): Improve the parameters needed, just prototyping now.
        var i, currSource, cssUrls, cssResources, sourceSet;
        // Fallback parsing if XHR is not JSON typed.
        if (typeof requests.target.response !== 'object') {
          sourceSet = (JSON.parse(requests.target.response)).Resources;
        } else {
          sourceSet = requests.target.response.Resources;
        }
        // Checking for actual fetched resources.
        if (sourceSet) {
          for (i = 0; (currSource = sourceSet[i]); i++) {
            // Resolving resource with blob URL.
            if (currSource.ContentType === 'text/css' &&
                currSource.Type === 'STRING') {
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
          Requestr.resolveDocumentCssUrls(css, dimp, styles, opt_callback);
        } else {
          // TODO (jam@): Add recursion for CSS imports.
          console.log('Error: CSS imports not currently supported!');
        }
      };
      /**
       * Resolves URLs in external CSS.
       * @param {Array.<Object>} css Array of external CSS data from
       *     service.
       * @param {HTMLDocument} dimp The DOM Implementation of the
       *     parsed document.
       * @param {Array.<StyleElement>} styles Array of style elements
       *     in dimp.
       * @param {Function=} opt_callback Optional callback method upon complete.
       */
      Requestr.resolveDocumentCssUrls = function(
          css, dimp, styles, opt_callback) {
        var urls = Requestr.resolvedUrls, url, i, currCss;
        // Parsing each CSS string and swapping URLs with blob URLs.
        for (i = 0; (currCss = css[i]); i++) {
          for (url in urls) {
            // For extenal CSS, storing original value since parsed
            // string will contain blob URLs.
            currCss.origData =
                currCss.origData ? currCss.origData : currCss.Data;
            currCss.Data = currCss.Data.replace(new RegExp(
                Requestr.thirdParty.preg_quote(url), 'gi'), urls[url]);
          }
          // Once parsed, creating blob from CSS resource.
          Requestr.replaceDocumentUrlsWithBlob(currCss, dimp, styles);
        }
        // Making callback.
        if (typeof opt_callback === 'function') {
          opt_callback();
        }
      };
      /**
       * Parses the URLs from the CSS strings returned by the service
       * @param {Array.<Object>} cssResources Array of CSS resources
       *     fetched from service.
       * @return {Array.<string>} Array of URLs parsed from CSS string.
       */
      Requestr.parseCssResourcesForUrls = function(cssResources) {
        var style, base, anchor, dimp, i, urls = [], sheetUrls, resolveUrl,
            currResource, length =
                (Array.isArray(cssResources) ? cssResources.length : 0);
        // Fallback, using the browser to resolve the URL.
        resolveUrl = function(source) {
          // TODO (jam@): Improve, this is super slow, should be
          // single Regex.
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
            if (style.sheet && !Requestr.browser.isFirefox &&
                !Requestr.browser.ieInternetExplorer) {
              // Getting URLs from cssRules, which will have absolute
              // resolved URLs.
              sheetUrls = Requestr.getUrlsFromCssString((
                  currResource.Data = Requestr.getParsedCssFromRules(
                      style.sheet.cssRules)));
            } else {
              // Fallback to string parsing if browser doesn't support
              // resolving URLs embedded in CSS (style or link).
              anchor = dimp.createElement('a');
              dimp.body.appendChild(anchor);
              // TODO (jam@): Improve URL parsing, this could be very slow.
              currResource.Data = currResource.Data.
                  replace(/\burl\((\'|\"|)([^\'\"]+?)\1\)/g,
                      resolveUrl);
              // Getting URLs from cssRules, which will have absolute
              // resolved URLs.
              sheetUrls = Requestr.getUrlsFromCssString(currResource.Data);
            }
            // Adding URLs from current cssResource to array of URLs
            // to fetch.
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
       * Appends cache data to a resource if found in cache.
       * @param {Array.<Object>} cache The cache to lookup the resource.
       * @return {Object} resource The resource lookup in the cache.
       */
      Requestr.matchResourceWithCache = function(cache, resource) {
        // Attempting to match against local cache.
        var success = false, match = Requestr.getMatchingObjectWithUrl(
            cache, resource.Url);
        // Checking for match in cache and appending data.
        if (match) {
          resource.Type = match.dataType;
          resource.Data = match.data;
          resource.ContentType = match.mimeType;
          success = true;
        }
        return success;
      };
      /**
       * Converts an URI resource to a typed blob window.URL.
       * @param {Object} resource The returned object from the API
       *     service.
       * @return {string} The window.URL created from the blob.
       */
      Requestr.createUrlFromResource = function(resource) {
        // Resolving from cache if no data present.
        if (!resource.Data) {
          if (!Requestr.matchResourceWithCache(
              Requestr.resourcesFetchedFromCache, resource)) {
            // Dispatching error event.
            Requestr.dispatchError(Requestr.customErrors.CACHING,
                'Unable to resolve resource from cache.');
          }
        }
        // Converting dataURI to a typed blob.
        var url, blob = (resource.Type === 'STRING' ?
            Requestr.dataStringToBlob(
            resource.Data, resource.ContentType) :
            Requestr.dataURItoBlob(resource.Data, resource.ContentType));
        // Adding resource to array to cache once document is resolved.
        Requestr.resourcesToCache[resource.Url] = {
          url: resource.Url,
          mimeType: resource.ContentType,
          dataType: resource.Type,
          token: resource.Token,
          date: Date.now(),
          // External CSS files store the original values.
          data: resource.origData || resource.Data
        };
        // Generating url from blob.
        return (Requestr.resolvedUrls[resource.Url] =
            window.URL.createObjectURL(blob)) || resource.Url;
      };
      /**
       * Creates blob URL from asset and replaces the original value in
       * elements.
       * @param {Object} currSource The object containing the data to
       *     create the blob.
       * @param {HTMLDocument} dimp The in memory document to use for
       *     the operation.
       * @param {Array.<StyleElement>} styles Array of style elements
       *     in dimp.
       */
      Requestr.replaceDocumentUrlsWithBlob = function(
          currSource, dimp, styleEls) {
        // Converting dataURI to a typed blob.
        var j, k, currMatchEl, matchingEls, currStyleEl,
            // Generating url from blob.
            url = Requestr.createUrlFromResource(currSource),
            isDevelopment = (Requestr.serialization ?
                Requestr.serialization.development : false);
        // TODO (jam@): Improve query matching logic, should be flexible
        // by defined attribute list.
        matchingEls = dimp.querySelectorAll(
            '[src="' + currSource.Url + '"], [href="' +
            currSource.Url + '"]');
        // Replacing original assets url with blob url.
        for (j = 0; (currMatchEl = matchingEls[j]); j++) {
          if (currMatchEl.src) {
            if (isDevelopment) {
              currMatchEl.setAttribute(
                  Requestr.ORIGINAL_URL_ATTRIBUTE, currMatchEl.src);
            }
            currMatchEl.setAttribute('src', url);
          }
          if (currMatchEl.href) {
            if (isDevelopment) {
              currMatchEl.setAttribute(
                  Requestr.ORIGINAL_URL_ATTRIBUTE, currMatchEl.href);
            }
            currMatchEl.setAttribute('href', url);
          }
        }
        // Replacing original CSS string with CSS string containing
        // parsed URLs.
        for (k = 0; (currStyleEl = styleEls[k]); k++) {
          // TODO (jam@): Standadize.
          if (currStyleEl.innerText) {
            currStyleEl.innerText = currStyleEl.innerText.replace(
                new RegExp(Requestr.thirdParty.preg_quote(currSource.Url),
                'gi'), url);
          } else if (currStyleEl.textContent) {
            currStyleEl.textContent = currStyleEl.textContent.replace(
                new RegExp(Requestr.thirdParty.preg_quote(currSource.Url),
                'gi'), url);
          }
        }
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
        return Requestr.dataURItoBlob('data:' + mime + ';base64,' +
            btoa(unescape(encodeURIComponent(data))), mime);
      };
      /**
       * Replaces current document with full HTML string, dispatches a
       * ready event for notification. All documents are assumed to be
       * the same as the template/root document.
       * @param {HTMLDocument} doc The HTML document parsed.
       * @param {string} html The HTML string to user for replacing
       *     document.
       */
      Requestr.setDocumentHtml = function(doc, html) {
        var dimp = window.document.implementation.createHTMLDocument(''),
            i, script, scriptEl;
        // Loading the HTML string to an in-memory DOM for parsing.
        dimp.documentElement.innerHTML = html;
        // Syncing attributes sets on documentElement since it's a
        // read-only element.
        Requestr.setDocumentElementAttributes(document.documentElement,
            doc.documentElement);
        document.documentElement.innerHTML = html;
        /*
         * TODO (jam@): Determine if the 'load' event should be wrapped
         * in a MutationObserver for the DOM to be ready. Also, determine
         * other elements besides 'script' would need such re-enabling.
         */
        script = document.querySelectorAll('script');
        // Enabling all script elements manually since disabled
        // via innerHTML.
        for (i = 0; (scriptEl = script[i]); i++) {
          // Creating new working script element.
          var newScriptEl = document.createElement('script');
          // Copying attributes.
          Requestr.duplicateElementAttributes(scriptEl, newScriptEl);
          // TODO (jam@): Handle no content.
          newScriptEl.textContent =
              scriptEl.textContent || scriptEl.innerText;
          // Inserting the element at the same position in the document.
          scriptEl.parentNode.insertBefore(newScriptEl, scriptEl);
          scriptEl.parentNode.removeChild(scriptEl);
        }
        // Removing class that allowed styling.
        document.documentElement.classList.remove(Requestr.LOADING_CLASS);
        // Faking load event so all other script work as is.
        window.dispatchEvent(new CustomEvent('load'));
        // Dispatching rendered event.
        Requestr.dispatchCustomEvent(
            Requestr.customEvents.DOCUMENT_RENDERED, {
              document: html
            });
      };
      /**
       * Create a window.URL from a blob of an HTML document.
       * @param {HTMLDocument} dimp The HTML document containing the
       *     parsed URLs.
       * @param {HTMLDocument} doc The HTML document read via original XHR.
       * @param {Function} callback The callback method to receive
       *     the outcome, send an object with the url and parsed HTML string.
       * @param {boolean=} opt_fragment Flag to determine if content is a
       *     document or an HTML fragment.
       */
      Requestr.createDocumentBlobUrl = function(
          dimp, doc, callback, opt_fragment) {
        // Syncing attributes set on documentElement since it's a
        // read-only element.
        Requestr.setDocumentElementAttributes(dimp.documentElement,
            doc.documentElement);
        // Creating URL from blob.
        var blobUrl;
        // Only creating URL if not a fragment.
        if (!opt_fragment) {
          blobUrl = window.URL.createObjectURL(Requestr.dataStringToBlob(
              dimp.documentElement.outerHTML, 'text/html'));
        }
        // TODO (jam@): A bug has been filed, hoping it makes it to
        // the HTML spec as browsers are not allowing query strings in
        // blob URLs, which means that if the blob URL is post-fixed with a
        // query string it will not be resolved by the browser and break.
        // Issue was filed with Firefox:
        // http://bugzilla.mozilla.org/show_bug.cgi?id=928121
        if (typeof callback === 'function') {
          // Making callback with object containing the blob URL and
          // the parsed document string.
          callback({
            url: blobUrl,
            html: dimp.documentElement.outerHTML
          });
          if (opt_fragment) {
            // TODO (jam@): Dispatch fragment event.
          } else {
            // Dispatching blob created event.
            Requestr.dispatchCustomEvent(
                Requestr.customEvents.DOCUMENT_BLOB_URL_CREATED, {
                  url: blobUrl,
                  html: dimp.documentElement.outerHTML
                });
          }
        }
      };
      /**
       * Copy all the attributes from one element to another.
       * @param {HTMLElement} fromElement The element to copy the
       *     attributes from.
       * @param {HTMLElement} toElement The element to copy the
       *     attributes to.
       */
      Requestr.duplicateElementAttributes = function(
          fromElement, toElement) {
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
       * Permission is hereby granted, free of charge, to any person
       * obtaining a copy of this software and associated documentation files
       * (the "Software"), to deal in the Software without restriction,
       * including without limitation the rights to use, copy, modify,
       * merge, publish, distribute, sublicense, and/or sell copies
       * of the Software, and to permit persons to whom the Software is
       * furnished to do so, subject to the following conditions:
       *
       * The above copyright notice and this permission notice shall be
       * included in all copies or substantial portions of the Software.
       *
       * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
       * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
       * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
       * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
       * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
       * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
       * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
       * DEALINGS IN THE SOFTWARE.
       *
       * Converts an URL to a string to use in Regex replacing.
       * @param {string} str The url string to normalize.
       * @return {string} The parsed string.
       */
      Requestr.thirdParty.preg_quote = function(str) {
        return (str + '').replace(
            new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
      };
      /* -------------------------------------------
           [END] Third party helper methods
           ------------------------------------------- */
      /**
       * Initializes Requestr.
       * @param {HTMLElement=} opt_serialization The element containing
       *     the serialization JSON data.
       */
      Requestr.init = function(opt_serialization) {
        // Checking for serialization to initialize Requestr.
        if (opt_serialization) {
          Requestr.parseSerialization(opt_serialization);
        } else {
          // This is needed if the serialization is loaded after the element
          // loading Requestr, meaning all serialization should be placed
          // prior to the Requestr script for optimal performance.
          window.addEventListener('DOMContentLoaded', function() {
            Requestr.parseSerialization((Requestr.serialization =
                document.querySelector(Requestr.SERIALIZATION_QUERY)));
          });
        }
      };
      // Since opening the data is async, getting serialization async.
      if (!Requestr.serialization) {
        window.addEventListener('DOMContentLoaded', function() {
          Requestr.serialization = document.querySelector(
              Requestr.SERIALIZATION_QUERY);
        });
      }
      // TODO (jam@): Check if WebSQL must also be closed like indexedDb.
      if (!window.indexedDB && Requestr.browser.isSafari) {
        // Initializing Requestr caching WebSQL database.
        Requestr.openLocalDb(Requestr.CACHING_DB_VERSION, function(result) {
          if (result) {
            // TODO (jam@): Dispatch cache database open success event.
          } else {
            // TODO (jam@): Dispatch cache database open error event.
          }
          // Initialzing Requestr after database open operation.
          Requestr.init(Requestr.serialization);
        });
      } else {
        Requestr.init(Requestr.serialization);
      }
    }());
  }
}
