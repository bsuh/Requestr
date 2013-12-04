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


Development Environment
-----------------------

If you would like to contribute or setup Requestr for local development, you will need to do the following:

1. Install `Node.js`, follow instructions on http://nodejs.org
2. Install `Grunt`, follow instructions on http://gruntjs.com/getting-started
3. Install the `Closure Linter`, follow instructions on https://developers.google.com/closure/utilities/docs/linter_howto

Once `Grunt` and the `Closure Linter` are installed:

3. Go into the main directory and run `npm install`
4. Once everything is installed, run `grunt githooks` and then run `grunt`

That's it, you will have the entire project built and ready for local development.

Requestr uses a `pre-commit` hook that runs the `default` task. This means that in order to commit your changes must pass both jasmine tests and jshint.


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

Requestr was developed at [Tradeshift](http://tradeshift.com) by José Antonio Márquez Russo ([@joseeight](https://twitter.com/joseeight)) with the help of Joakim Recht ([@joakimrecht](https://twitter.com/joakimrecht)), Joseph McCarthy ([@jmccarthy14](https://twitter.com/jmccarthy14)), and many other awesome [Tradeshifters](https://github.com/Tradeshift?tab=members).
