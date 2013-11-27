Requestr
========

Requestr wants to fix the latency issue created by the waterfall approach of loading assets by browsers. In order to do this, Requestr will look at executing JavaScript at runtime and use a server-side API to combine all the network requests into a single request. Combining the multiple network requests into a single requests will drastically speed up the time it takes to load all the assets by eliminating the latency added as the requests are made in the grouped waterfall currently implemented by the browsers.

The benefit of combining the network requests is that the browser is only attempting to fetch a single request, which cuts down the latency of the waterfall, while also moving the network request to a single thread, which speeds up the available computing power available to the window while loading these network requests.

Under the Hood
--------------

In order to achieve this ambitious goal, Requestr uses a mix of Frontend and Backend APIs. On the Frontend, Requestr provides a single JavaScript library to be loaded by the window attempting to use it. This library will then use native browser provided APIs to parse the document for network request URLs, and aggregate all those requests to be fetched from the Backend API in a single network request. The Backend API will then get the aggregated network requests URLs and form a JSON structure that returns all the network requests as, for the moment, data URIs or strings. Alternatively, the JSON returned by the backend API could be manually created, removing the need for a Backend API.

Once the Backend API returns the JSON data, the Frontend library converts the data URI and string data into in-memory requests that the browser can redirect the original network request to, essentially removing the need to make an actual network request, and instead loading the request from the browser's memory.


Using Requestr
--------------

Details


Supported Browsers
------------------

Since Requestr is making use of a lot of modern browser APIs, particularly those of the HTML5 specification, there will be some limits as to which browsers Requestr will support at runtime.

It is the intent of Requestr to support the following browsers:

- `Chrome 31+`
- `Firefox 25+`
- `Safari 7+`
- `Internet Explorer 10+`

More browsers will be added as tests are conducted and such browsers adopt and integrate the HTML5 specification. Alternatively, Requestr will look at using server-side helpers to make it possible to support legacy browsers in the future. Currently, Requestr has been tested on `Chrome`, `Firefox`, `Internet Explorer 10`, and `Safari`, and proven to perform as designed.


Caveats
-------

Requestr is still in "alpha" mode, so there will with no doubt be many issues we will need to address before getting a much stable version. These are some of the currently known issues with Requestr:

- `Internet Explorer 10` does not support document blob URLs, so using the `loadPage` method to load a document will need to be handle differently when setting `src` to an `iFrame`. Instead of setting `src` to the `iFrame`, target the `iFrame` and replace the `innerHTML` of the `documentElement` with the `html` provided in the `loadPage` callback.
- `Safari` does not support `IndexedDb` so a `WebSQL` polyfill was added, although there is a size limit of 5MB which will need to be improved for caching support.

If you encounter any issues, please report them here on Github, we will gladly take any feedback in an effort to improve Requestr. And as always, feel free to fork and send us a pull-request with any features, fixes, and/or improvements!


Credits
-------

Details