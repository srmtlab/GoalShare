/**
 * Wiki/dbpedia functionality
 */
var pedia = {
	wikipediaAPIURI: "http://en.wikipedia.org/w/api.php",	
	wikipediaBaseURI: "http://en.wikipedia.org/wiki/",
	dbpediaBaseURI: "http://dbpedia.org/resource/"
};


pedia.search = function(term, callback){
	geoRequests.qeoSearchQuery = $.ajax({
		url: wikipediaAPIURI,
		jsonp: "pedia.callback",
		dataType: "jsonp",
		data: {
			name_startsWith: name,
			maxRows:30,
			format: "json"
		},
		// work with the response
		success:function(data){
			geoRequests.qeoSearchQuery = null; 
						callback(data);}
	});
};

// Debug callback
pedia.callback = function(data){
	console.log(data);
};


function searchWiki(site, search, callback, opts) {
    if(typeof callback == 'object') {
        opts = callback;
        callback = null;
    } else {
        opts = opts || {};
    }
    // Build the required URLs
    var siteUrl = (opts.ssl ? 'https' : 'http') + '://' + site;
    var apiUrl = siteUrl + (opts.apiBase || '/w/') + 'api.php';
    var queryUrl = apiUrl + '?action=query&list=search&srsearch=' + encodeURIComponent(search) + '&srlimit=' + (opts.maxResults || 1) + '&format=json';
    // Issue the JSONP request
    $.ajax(queryUrl + '&callback=?', {
        dataType: 'jsonp',
        cache: true,
        success: function(data) {
            // Get all returned pages
            var titles = [], links = [];
            for(var i = 0; i < data.query.search.length; i++) {
                var title = data.query.search[i].title,
                    link = siteUrl + (opts.wikiBase || '/wiki/') + encodeURIComponent(title);
                titles.push(title);
                links.push(link);
            }
            if(!opts.maxResults) {
                // Single result requested
                if(data.query.search.length == 0) {
                    titles = links = null;
                } else {
                    titles = titles[0];
                    links = links[0];
                }
            }
            // Call the callback
            (callback || opts.success || function(){})(titles, links);
        }
    });
}

function getDBPediaURI (link){
	return link.replace(pedia.wikipediaBaseURI, pedia.dbpediaBaseURI);
}

function getPediaTitle(link){
	return decodeURIComponent( link.replace(pedia.wikipediaBaseURI, "").replace(pedia.dbpediaBaseURI, ""));
}