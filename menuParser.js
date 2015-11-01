var request = require('request');
var NodeCache = require('node-cache');
var cache = new NodeCache();

// Time to live for cache entry until it gets updated [in seconds]
var CACHE_TTL = 60 * 60 * 24; // sec/min * min/h * h/day =  seconds/day

// Status codes for API call
var STATUSCODE = {
    OK : 0,
    WEEKEND : 1,
    ERROR : 2
};

exports.today = function (req, res) {
    var date = today();
    if ( isWeekend() ) {
        res.send( { "statusCode" : STATUSCODE.WEEKEND, "content": [] } );
        return;
    }
    getCachedData(req, res, date);
}

exports.tomorrow = function (req, res) {
    var date = tomorrow();
    if ( isWeekend() ) {
        res.send( { "statusCode" : STATUSCODE.WEEKEND, "content": [] } );
        return;
    }
    getCachedData(req, res, date);
}

// Entire week, all cafes
exports.parseMenu = function (req, res) {
    var date = currentWeek();
    getCachedData(req, res, date);
}

// sendResponse is a boolean indicating whether a response should be send (no cached data was found)
// or if the cache just needs to get refreshed and the result should not be send
function makeApiCall (req, res, date, sendResponse) {
    console.log("Making API call for", date);
    callOptions = {
        url: "http://legacy.cafebonappetit.com/api/2/menus",
        qs: {
            format: 'json',
            cafe: '245,246,247', // Cafe3, Cafe1, Cafe8 
            date: date
        }
    };
    console.log(callOptions)
    request(callOptions, function (error, response, body) {
        if (error || response.statusCode != 200) {
            console.log("Error while trying to make API call. Status Code: " + response.statusCode);
            return {"statusCode": STATUSCODE.ERROR, "content":[] };
        }

        parseApiResponse(body, date, res, sendResponse);
    })
}

// sendResponse is a boolean indicating whether a response should be send (no cached data was found)
// or if the cache just needs to get refreshed and the result should not be send
function parseApiResponse (body, date, res, sendResponse) {
    var resultJson = [];
    var rawMenu = JSON.parse(body);

    date = date.split(",");
    for (var i = 0; i < date.length; i++) {
        resultJson.push([]);

        // Café 1
        resultJson[i].push({    cafeId: 1,
                                categories: allCategoriesForCafeAndDay(rawMenu, '246', i)
                           });

        // Café 3
        resultJson[i].push({    cafeId: 3,
                                categories: allCategoriesForCafeAndDay(rawMenu, '245', i)
                           });        

        // Café 8
        resultJson[i].push({  cafeId: 8,
                              categories: allCategoriesForCafeAndDay(rawMenu, '247', i)
                           });   
    }

    // wrap json array on object to give information about status
    resultJson = {"statusCode" : STATUSCODE.OK, "content" : resultJson};

    // Cache the result
    cache.set(date, resultJson, CACHE_TTL);

    if (sendResponse) {
        res.send(resultJson);   
    }
    return;
}

// TODO: Error handling
function allCategoriesForCafeAndDay (rawMenu, id, dayIndex) {
    var categoryNames = rawMenu.days[dayIndex].cafes[id].dayparts[0][1].stations;
    var categories = [];

    var i = 0;
    for (var j = 0; j < categoryNames.length - 1; j++) {
        var categoryData = {
                                label: categoryNames[j].label, 
                                menuItems: []
                           };

        for (var k = 0; k < categoryNames[j].items.length; k++) {
            itemId = categoryNames[j].items[k];
            item = rawMenu.items[itemId]
            menuItem = {
                        label : item.label, 
                        description : item.description
                    }
            categoryData.menuItems.push(menuItem);
            i++;
        }
        categories.push(categoryData);
    };

    return categories;
}

function getCachedData (req, res, date) {
    // Perform cache lookup
    var cached = cache.get(date);
    if (cached == undefined) {          // cache miss
        makeApiCall(req, res, date, true);
    } else {                            // cache hit
        res.send(cached);
        makeApiCall(req, res, date, false);
    }
}

function currentWeek () {
    var d = new Date();

    var day = d.getDay();

    var month = d.getMonth();

    // Date of Monday of current week
    var date = d.setDate(d.getDate() - day + 1)

    var returnString = '';
    for (var i = 0; i < 5; i++) {
        returnString += d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate().toString() + ',';
        d.setDate(d.getDate() + 1)
    }
    return returnString.slice(0, - 1);
}

function buildDateStringForApi(d) {
    var day = d.getDate() < 10 ? "0" + d.getDate().toString() : d.getDate().toString();
    var month = (d.getMonth() + 1) < 10 ? "0" + (d.getMonth() + 1).toString() : (d.getMonth() + 1).toString();
    return d.getFullYear().toString() + '-' + month + '-' + day;
}

function today () {
    var d = new Date();
    return buildDateStringForApi(d)
}

function tomorrow () {
    var d = new Date();
    d.setDate(d.getDate()+1)
    return buildDateStringForApi(d)
}

function isWeekend () {
    var d = new Date();
    var weekday = d.getDay();
    return weekday > 5
}
