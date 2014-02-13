/*
 * Person related functions. For displaying person data.
 *  
 * Notice! user.js is for current logged in user
 */

var personData = {
	options:{
		pageSize: 10,
		centerLat : 35.1815,
		centerLng : 136.9064,
		defaultZoom : 11,
		targetElement: "person-detail-map",
	},
	data: {
		map: null,
		wishedGoals: new Array(),
		createdGoal:  new Array(),
	},
	
	appendMapItem: function(item){
		
	},
	
	initControls: function(){
		// Search
		$("#personFilterSubmit").unbind("click").click(function(){
			console.log("Person");
			var result = userAPI.getUsers();
			if ( result && result.users){
				personData.users = result.users; 
				personData.showUsers(1, true);
			}
		});
	},
	showUsers: function(page, selectFirst){
		if (personData.users) {
			$("#personListPlaceholder")
					.loadTemplate(
							"templates/personResourceTemplate.html",
							personData.users,
							{
								paged : true,
								elemPerPage : personData.options.pageSize,
								pageNo : page,
								isFile : true,
								success : function() {
									// Populate the goal list and fetch additional data
									localizeUI();
									if (personData.users.length <= personData.options.pageSize
											* personData.data.personPage) {
										$("#personPagerNext").attr('disabled',
												'disabled');
									} else {
										$("#personPagerNext").removeAttr('disabled');
									}
									if (page <= 1)
										$("#personPagerPrev").attr('disabled',
												'disabled');
									else
										$("#personPagerPrev").removeAttr('disabled');

									$("div.resource.person").click(
											function() {
												console.log(this);
												var personURI = $(this).data("target-person-uri");
												$("div.resource.person").removeClass("selected");
												$(this).addClass("selected");
												var data = $.grep(personData.users, function(item, index ){
													return item.personURI === personURI;
												});
												personData.displaypersonDetails(personURI, { person: data });
											});
								},
								errorMessage : "Error",
							});
		}
	},
	displaypersonDetails: function(personURI, data){
		personData.resetPersonDetails();
		var inst = this;
		personData.resetPersonDetails();
		$("#personDetailBody")
		.loadTemplate(
				"templates/personDetailTemplate.html",
				data.person,
				{
					isFile : true,
					success : function() {
						inst.data.map = new google.maps.Map(document.getElementById(inst.options.targetElement),
								{ center: new google.maps.LatLng(inst.options.centerLat, inst.options.centerLng), 
								zoom: inst.options.defaultZoom
						}); 
						// Fetch data
						inst.detailDataFetchers.getUserCreateGoals(personURI);
					}
				});
	},
	resetPersonDetails: function(){
		// map
		$("#personDetailBody").children().remove();
		
	},
	addCreateGoal: function(goal){
		
		goal.map.marker = new google.maps.Marker({position: new google.maps.LatLng(goal.map.lat, goal.map.lng)});
		goal.map.marker.setMap(this.data.map);
		personData.data.createdGoals.push(goal);
		
	},
	detailDataFetchers: {
		getUserCreateGoals: function(personURI){
			var inst = this;
			goalAPI.queryGoals(function(data){
				$.each(data.goals, function(i, val){
					var goal = val;
					getGEOByURI(val.locationURI, function(data){
						console.log(data);
						goal.map = {};
							if ( data.geonames.length > 0 ){
								goal.map.lat = data.geonames[0].lat;
								goal.map.lng = data.geonames[0].lng;
							}
							personData.addCreateGoal( goal );
						});
					
				});
				console.log(data);
			}, {creatorURI: personURI})
		}
		
	}
};





$(document).ready(function(){
	personData.initControls();
	
});