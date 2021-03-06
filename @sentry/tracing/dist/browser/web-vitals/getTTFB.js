/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var initMetric_1 = require("./lib/initMetric");
var afterLoad = function (callback) {
    if (document.readyState === 'complete') {
        // Queue a task so the callback runs after `loadEventEnd`.
        setTimeout(callback, 0);
    }
    else {
        // Use `pageshow` so the callback runs after `loadEventEnd`.
        addEventListener('pageshow', callback);
    }
};
var getNavigationEntryFromPerformanceTiming = function () {
    // Really annoying that TypeScript errors when using `PerformanceTiming`.
    // Note: browsers that do not support navigation entries will fall back to using performance.timing
    // (with the timestamps converted from epoch time to DOMHighResTimeStamp).
    // eslint-disable-next-line deprecation/deprecation
    var timing = performance.timing;
    var navigationEntry = {
        entryType: 'navigation',
        startTime: 0,
    };
    for (var key in timing) {
        if (key !== 'navigationStart' && key !== 'toJSON') {
            navigationEntry[key] = Math.max(timing[key] - timing.navigationStart, 0);
        }
    }
    return navigationEntry;
};
exports.getTTFB = function (onReport) {
    var metric = initMetric_1.initMetric('TTFB');
    afterLoad(function () {
        try {
            // Use the NavigationTiming L2 entry if available.
            var navigationEntry = performance.getEntriesByType('navigation')[0] || getNavigationEntryFromPerformanceTiming();
            metric.value = metric.delta = navigationEntry.responseStart;
            metric.entries = [navigationEntry];
            metric.isFinal = true;
            onReport(metric);
        }
        catch (error) {
            // Do nothing.
        }
    });
};
//# sourceMappingURL=getTTFB.js.map