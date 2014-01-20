/**
 * Geonames API handler
 * 
 * Makes requests to GEONAMES with JSONP
 * http://www.geonames.org/
 * 
 */

var geoRequests = {
	qeoSearchQuery: null
};

function searchGEO(name, callback){
	if(geoRequests.qeoSearchQuery)
		geoRequests.qeoSearchQuery.abort();
	geoRequests.qeoSearchQuery = $.ajax({
		//url: "http://ws.geonames.org/searchJSON",
		url: "http://api.geonames.org/searchJSON",
		jsonp: "callback",
		dataType: "jsonp",
		data: {
			name_startsWith: name,
			maxRows:30,
			format: "json",
			username: "gs_user"
		},
		success:function(data){
			geoRequests.qeoSearchQuery = null;
			var result = new Array();
			jQuery.each(data.geonames, function(i, val) {
				console.log("GEO Adding data " + val.name);
				result.push({ type: "geonames", 
					name: val.name, 
					geoid: val.geonameId, 
					id: val.geonameId, 
					lat:  val.lat, 
					lng:  val.lng,
					URI: "http://sws.geonames.org/"+val.geonameId+"/"});	  
			});
			if ( callback )
				callback({ geonames: ( result.length == 0 ) ? null : result });
			}
	});
}
function getGEOByURI(uri, callback){
	console.log("geouri: " + uri);
	if ( uri.slice(-1) != "/" )
		uri = uri + "/";
	if(!uri || uri == "")
		return null;
	if(uri.indexOf(geoLOD.baseURI) != -1)
		return geoLOD.getGEOByURI(uri, callback);
	var id = uri.match(/[0-9]+/)[0].replace("/", "");
	//console.log("aa" + id);
	if( id )
		getGEOByID(id, callback);
}
function getGEOByID(id, callback){
	//console.log("geoID " + id);
	//:http://api.geonames.org/getJSON?formatted=true&geonameId=6295630&username=demo&style=full
	$.ajax({
		url: "http://api.geonames.org/getJSON",
		jsonp: "callback",
		dataType: "jsonp",
		beforeSend: function setHeader(xhr) {
		     xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
		    },
		// tell YQL what we want and that we want JSON
		data: {
			//q:"Kuopio",
			formatted: "true",
			geonameId: id,
			style: "full",
			format: "json",
			username: "gs_user"
		},
		// work with the response
		success: function(val){
			var result = new Array();
			
			result.push({ type: "geonames", 
				name: val.name, 
				geoid: val.geonameId, 
				id: val.geonameId, 
				lat:  val.lat, 
				lng:  val.lng,
				URI: "http://sws.geonames.org/"+val.geonameId});	  
		
			callback({ geonames: result });
			}
	});
}

function searchGEONLP(name){
	var result = {};
	$.ajax({url:'http://localhost/api/geonlp.pl',
		async:false,	
		data: {name: name },
		success: function(data){result = data;}
	
			});
	return result;
}

function getNLPLocations(name){
	var res = searchGEONLP(name);
	for( var i = 0; i < res.result.length; i++ ){
		if(res.result[i].geo){
			console.log("point:");
			console.log("name: " + res.result[i].geo.properties.name  +"Lat: " + res.result[i].geo.geometry.coordinates[0] + "Lat: " + res.result[i].geo.geometry.coordinates[1] );
		}
	}
}