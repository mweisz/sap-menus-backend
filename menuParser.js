var request = require('request');

exports.parseMenu = function (req, res) {
    console.log("lets go");
    var date = currentWeek();
    // Make API call to Café Bon Appétit
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
    var resultJson = {};
    var rawMenu = JSON.parse(body);

    for (var i = 0; i < 5; i++) {
        resultJson[i] = {};

        // Café 1
        resultJson[i].cafe1 = allItemsForCafeAndDay(rawMenu, '246', i);

        // Café 3
        resultJson[i].cafe3 = allItemsForCafeAndDay(rawMenu, '245', i);

        // Café 8
        resultJson[i].cafe8 = allItemsForCafeAndDay(rawMenu, '247', i);
    }

    res.send(resultJson);
    return;
}

// TODO: Error handling
function allItemsForCafeAndDay (rawMenu, id, dayIndex) {
    console.log(dayIndex);
    var categories = rawMenu.days[dayIndex].cafes[id].dayparts[0][1].stations;
    var items = {};

    var i = 0;
    for (var j = 0; j < categories.length - 1; j++) {
        for (var k = 0; k < categories[j].items.length; k++) {
            itemId = categories[j].items[k];
            items[i] = rawMenu.items[itemId].label;
            i++;
        }
    };

    return items;
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