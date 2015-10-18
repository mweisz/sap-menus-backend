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
        if (!error && response.statusCode == 200) {
            var rawMenu = JSON.parse(body);
            var categories = rawMenu.days[0].cafes['245'].dayparts[0][1].stations;

            for (var i = 0; i < categories.length; i++ ) {
                console.log(categories[i].label);
            }

            res.send(rawMenu.days[0].cafes['245'].name);

        } else {
            console.log("Error while trying to make API call. Status Code: " + response.statusCode);
        }
    })
}