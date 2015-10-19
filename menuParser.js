var request = require('request');

exports.parseMenu = function (req, res) {

    // Make API call to Café Bon Appétit
    callOptions = {
        url: "http://legacy.cafebonappetit.com/api/2/menus",
        qs: {
            format: 'json',
            cafe: '245,246,247', // Cafe3, Cafe1, Cafe8 
            date: '2015-10-20'
        }
    };

    request(callOptions, function (error, response, body) {
        if (error || response.statusCode != 200) {
            console.log("Error while trying to make API call. Status Code: " + response.statusCode);
            res.send("Error while trying to make API call. Status Code: " + response.statusCode)
            return(response.statusCode)
        }

        var resultJson = {};

        var rawMenu = JSON.parse(body);
        
        // Café 3
        console.log('enter first call allItemsForCafe')
        resultJson.cafe1 = allItemsForCafe(rawMenu, '246')
        
        // Café 3
        resultJson.cafe3 = allItemsForCafe(rawMenu, '245')

        // Café 3
        resultJson.cafe8 = allItemsForCafe(rawMenu, '247')

        res.send(resultJson);
        return;
    })
}

// TODO: Error handling
function allItemsForCafe (rawMenu, id) {
    var categories = rawMenu.days[0].cafes[id].dayparts[0][1].stations;
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