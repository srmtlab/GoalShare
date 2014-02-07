/*
 * Map visualization 
 */
//google.maps.visualRefresh = true;

function maps(targetElement, options){
	options = typeof options !== 'undefined'? options : {};
	this.mapItems = {};
	this.func = {};
	this.data = {};
	this.controls = {};
	this.data.goals = new Array();
	this.data.issues = new Array();
	
	this.options = {
		centerLat : 35.1815,
		centerLng : 136.9064,
		defaultZoom : 11,
		infoShowDuration: 3000
	};
	
	this.func.targetElement = targetElement;
	
	this.func.map = new google.maps.Map(document.getElementById(this.func.targetElement)
			,{ center: new google.maps.LatLng(this.options.centerLat, this.options.centerLng),
		zoom: this.options.defaultZoom
	});
	this.initData();
};

//maps.pototype.createControls = function(){
//	var inst = this;
//	this.control.wrapper = $("<div />").addClass("MapsControlWrapper");
//}
maps.prototype.addGoal = function(item){
	var mapInst = this;
	this.data.goals.push(item);
	var lat = parseFloat(item.map.lat) + ( (Math.random() -0.5)/100 );
	var lng = parseFloat(item.map.lng) + ( (Math.random() -0.5)/100 );
	item.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng),
												icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"});
	item.map.marker.setMap(this.func.map);
	item.map.infoWindow = new google.maps.InfoWindow({ content: item.title });
	var itemInst = item;
	google.maps.event.addListener(item.map.marker, 'click', function() {
		  	item.map.infoWindow.open(mapInst.func.map, itemInst.map.marker);
		  	window.setTimeout(function(){ itemInst.map.infoWindow.setMap(null); } ,mapInst.options.infoShowDuration);
		  });
};

maps.prototype.addIssue = function(item){
	var mapInst = this;
	this.data.issues.push(item);
	var lat = parseFloat(item.map.lat) + ( (Math.random() -0.5)/100 );
	var lng = parseFloat(item.map.lng) + ( (Math.random() -0.5)/100 );
	item.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng)});
	item.map.marker.setMap(this.func.map);
	item.map.infoWindow = new google.maps.InfoWindow({ content: item.title });
	var itemInst = item;
	google.maps.event.addListener(item.map.marker, 'click', function() {
		  	item.map.infoWindow.open(mapInst.func.map, itemInst.map.marker);
		  	window.setTimeout(function(){ itemInst.map.infoWindow.setMap(null); } ,mapInst.options.infoShowDuration);
		  });
};



maps.prototype.initData = function(){
	var inst = this;
	// get goals
	goalAPI.queryGoals(function(data){
		$.each(data.goals, function(i, val){
			getGEOByURI(val.locationURI, function(data){
				//console.log(data);
				if ( data.geonames.length > 0 ){
					val.map = {};
					val.map.lat = data.geonames[0].lat;
					val.map.lng = data.geonames[0].lng;
					inst.addGoal( val );
				}
				
			});
		});
	}, {num: 50});
	
	// get goals
	issueAPI.queryIssues(function(data){
		$.each(data.issues, function(i, val){
			getGEOByURI(val.locationURI, function(data){
				console.log(data);
				if ( data.geonames.length > 0 ){
					val.map = {};
					val.map.lat = data.geonames[0].lat;
					val.map.lng = data.geonames[0].lng;
					inst.addIssue( val );
				}
				
			});
		});
	}, {num: 50});
};
var mp;

$(document).ready(function(){
	mp = new maps("googleMap");
});


