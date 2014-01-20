/**
 * GeoNLP API handler
 * Handles requests for GeoNLP location API
 * 
 * Requires proxy forward from the server.
 * 
 * https://geonlp.ex.nii.ac.jp/
 * 
 */

var geoLOD = {
	qeoSearchQuery: null,
	// Configuration
	baseURI: "http://geolod.ex.nii.ac.jp/",
	//serviceURL: "/goalshare/geolod_proxy/"
	serviceURL: "https://dias.ex.nii.ac.jp/geonlp/api/1/geo-tagging"
		//https://dias.ex.nii.ac.jp/geonlp/api/1/geo-tagging
};

// Search geo-locations by name
geoLOD.searchGEO = function(name, callback){
	if(geoLOD.qeoSearchQuery)
		geoLOD.qeoSearchQuery.abort();
	geoLOD.qeoSearchQuery = $.ajax({
				type: "GET",
				url: "/api/geoproxy.php",
				dataType: "json",
				data: {
					command: "search",
					param: name
				},
				success:function(data){
					geoLOD.qeoSearchQuery = null; 
					var result = new Array();
					jQuery.each(data.result, function(i, val) {
						console.log("GEOLOD Adding data " + val.fullname);
						// Either fullname or body + suffixes
						var name = ( val.fullname && val.fullname != "" )? val.fullname :
																val.body + ( val.suffix )? val.suffix.join("") : "";
						result.push({ type: "geolod", 
							name: name, 
							geoid: val.geonlp_id, 
							id: val.geonlp_id, 
							lat:  val.latitude, 
							lng:  val.longitude,
							URI: geoLOD.getURI(val.geonlp_id)});	  
					});
					if ( callback )
						callback({ geonames: ( result.length == 0 ) ? null : result });
					//callback(data);
				}
			});
};

// Get geo-location from a url
geoLOD.getGEOByURI = function(uri, callback){
	if(!uri || uri == "")
		return null;
	var id = uri.substring(geoLOD.baseURI.length).replace("/", "");
	if( id )
		geoLOD.getGEOByID(id, callback);
};
geoLOD.getGEOByID = function(id, callback){
	$.ajax({
		type: "GET",
		url: "/api/geoproxy.php",
		dataType: "json",
		data: {
			command: "get",
			param: id
		},
		success:function(data){
			geoLOD.qeoSearchQuery = null;
			var result = new Array();
			jQuery.each(data.result, function(i, val) {
				result.push({ type: "geolod", 
					name: val.body, 
					geoid: val.geonlp_id, 
					id: val.geonlp_id, 
					lat:  val.latitude, 
					lng:  val.longitude,
					URI: geoLOD.getURI(val.geonlp_id)});	  
			});
			callback({ geonames: result });
		}
	});
};

geoLOD.searchGEONLP = function(name){
	var result = {};
	$.ajax({url:'http://localhost/api/geonlp.pl',
		async:false,	
		data: {name: name },
		success: function(data){result = data;}
	
			});
	return { geonames: result };
};

geoLOD.getNLPLocations = function(name){
	var res = geoLOD.searchGEONLP(name);
	for( var i = 0; i < res.result.length; i++ ){
		
	}
};
// Return correctly formatted URI
geoLOD.getURI = function(id){
	return this.baseURI + id + "/";
}