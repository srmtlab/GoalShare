

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
				// work with the response
				success:function(data){
					console.log(data);
					geoLOD.qeoSearchQuery = null; 
					var result = new Array();
					jQuery.each(data.result, function(i, val) {
						result.push({ type: "geolod", 
							name: (val.fullname)?val.fullname:val.body+(val.suffix)?val.suffix.join(""):"", 
							geoid: val.geonlp_id, 
							id: val.geonlp_id, 
							lat:  val.latitude, 
							lng:  val.longitude,
							URI: geoLOD.getURI(val.geonlp_id)});	  
					});
					callback({ geonames: result });
					//callback(data);
				}
			});
//		$.ajax({
//		type: "POST",
//		url: geoLOD.serviceURL,
//		//X-GeoNLP-Authorization: cb55f790-2266-4315-ae6d-4932b0d4acef
//		beforeSend: function(xhr){xhr.setRequestHeader('X-GeoNLP-Authorization', 'cb55f790-2266-4315-ae6d-4932b0d4acef');},
//		dataType: "json",
//		// tell YQL what we want and that we want JSON
//		data: {
//			method: "Geonlp.Search",
//			params: [ name ],
//			//maxRows:30,
//			format: "json"
//		},
//		// work with the response
//		success:function(data){
//			geoLOD.qeoSearchQuery = null; 
//						callback(data);}
//	});
};
// Get geo-location from a url
geoLOD.getGEOByURI = function(uri, callback){
	//console.log("geouri: " + uri);
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
		// work with the response
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
//	$.ajax({
//		url: geoLOD.serviceURL,
//		//jsonp: "callback",
//		dataType: "json",
//		beforeSend: function setHeader(xhr) {
//		     xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
//		    },
//		// tell YQL what we want and that we want JSON
//		data: {
//			method: "Geonlp.GetGeoInfo",
//			params: [id],
//			id: 4
//		},
//		// work with the response
//		success:callback
//	});
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
		if(res.result[i].geo){
			//console.log("point:");
			//console.log("name: " + res.result[i].geo.properties.name  +"Lat: " + res.result[i].geo.geometry.coordinates[0] + "Lat: " + res.result[i].geo.geometry.coordinates[1] );
		}
	}
};
geoLOD.getURI = function(id){
	return this.baseURI + id;
}