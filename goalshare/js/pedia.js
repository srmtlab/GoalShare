function pedia(){
	this.wikipediaAPIURI = "http://en.wikipedia.org/w/api.php"; 	
};


pedia.prototype.search = function(term, callback){
	geoRequests.qeoSearchQuery = $.ajax({
		url: wikipediaAPIURI,
		// the name of the callback parameter, as specified by the YQL service
		jsonp: "pedia.callback",
		// tell jQuery we're expecting JSONP
		dataType: "jsonp",
		// tell YQL what we want and that we want JSON
		data: {
			//q:"Kuopio",
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


pedia.prototype.callback = function(data){
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
        // This prevents warnings about the unrecognized parameter "_"
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