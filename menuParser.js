var request = require('request');
var NodeCache = require('node-cache');
var cache = new NodeCache();

// Time to live for cache entry until it gets updated [in seconds]
var CACHE_TTL = 60 * 60 * 24; // sec/min * min/h * h/day =  seconds/day


exports.today = function (req, res) {
    var date = today();
    getCachedData(req, res, date);
}

exports.tomorrow = function (req, res) {
    var date = tomorrow();
    getCachedData(req, res, date);
}

// Entire week, all cafes
exports.parseMenu = function (req, res) {
    var date = currentWeek();
    getCachedData(req, res, date);
}

function makeApiCall (req, res, date) {
    callOptions = {
        url: "http://legacy.cafebonappetit.com/api/2/menus",
        qs: {
            format: 'json',
            cafe: '245,246,247', // Cafe3, Cafe1, Cafe8 
            date: date
        }
    };

    request(callOptions, function (error, response, body) {
        if (error || response.statusCode != 200) {
            console.log("Error while trying to make API call. Status Code: " + response.statusCode);
            res.send("Error while trying to make API call. Status Code: " + response.statusCode)
            return(response.statusCode)
        }

        parseApiResponse(body, date, res);
    })
}

function parseApiResponse (body, date, res) {
    var resultJson = [];
    var rawMenu = JSON.parse(body);

    date = date.split(",");
    for (var i = 0; i < date.length; i++) {
        resultJson.push([]);

        // Café 1
        resultJson[i].push({    cafeId: 1,
                                menuItems: allItemsForCafeAndDay(rawMenu, '246', i)
                           });

        // Café 3
        resultJson[i].push({    cafeId: 3,
                                menuItems: allItemsForCafeAndDay(rawMenu, '245', i)
                           });        

        // Café 8
        resultJson[i].push({  cafeId: 8,
                              menuItems: allItemsForCafeAndDay(rawMenu, '247', i)
                           });   
    }

    // Cache the result
    cache.set(date, resultJson, CACHE_TTL);

    res.send(resultJson);
    return;
}

// TODO: Error handling
function allItemsForCafeAndDay (rawMenu, id, dayIndex) {
    var categories = rawMenu.days[dayIndex].cafes[id].dayparts[0][1].stations;
    var items = [];

    var i = 0;
    for (var j = 0; j < categories.length - 1; j++) {
        for (var k = 0; k < categories[j].items.length; k++) {
            itemId = categories[j].items[k];
            items.push(rawMenu.items[itemId].label);
            i++;
        }
    };

    return items;
}

function getCachedData (req, res, date) {
    // Perform cache lookup
    var cached = cache.get(date);
    if (cached == undefined) {          // cache miss
        makeApiCall(req, res, date);
    } else {                            // cache hit
        res.send(cached);
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

function today () {
    var d = new Date();
    return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate().toString();
}

function tomorrow () {
    var d = new Date();
    return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + (d.getDate() + 1).toString();
}
