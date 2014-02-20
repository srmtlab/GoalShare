/*
 * Person related functions. For displaying person data.
 *  
 * Notice! user.js is for current logged in user
 */

var personData = {
	options:{
		pageSize: 30,
		centerLat : 35.1815,
		centerLng : 136.9064,
		defaultZoom : 11,
		targetElement: "person-detail-map",
	},
	data: {
		map: null,
		wishedGoals: new Array(),
		createdGoals:  new Array(),
		participatedGoals: new Array(),
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
		//personData.resetPersonDetails();
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
						inst.detailDataFetchers.getUserWishedGoals(personURI);
						inst.detailDataFetchers.getUserParticipatedGoals(personURI);
						inst.detailDataFetchers.getUserIssues(personURI);
					}
				});
	},
	resetPersonDetails: function(){
		// map
		$("#personDetailBody").children().remove();
		
	},
	addCreateGoal: function(goal){
		$("#personCreatedGoalsWrapper").append(
				$("<li />").append(
						$("<a />").attr("href", getGSGoalLink(goal.url) )
						.text(goal.title) 
				)
		);
		var lat = parseFloat(goal.map.lat) + ( (Math.random() -0.5)/100 );
		var lng = parseFloat(goal.map.lng) + ( (Math.random() -0.5)/100 );
		goal.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng)});
		goal.map.marker.setMap(this.data.map);
		personData.data.createdGoals.push(goal);
		goal.map.infoWindow = new google.maps.InfoWindow({ content: goal.title });
		google.maps.event.addListener(goal.map.marker, 'click', function() {
				goal.map.infoWindow.open(personData.data.map, goal.map.marker);
			  	window.setTimeout(function(){ goal.map.infoWindow.setMap(null); } ,3000);
			  });
		
	},
	addWishedGoal: function(goal){
		$("#personWishedGoalsWrapper").append(
				$("<li />").append(
						$("<a />").attr("href", getGSGoalLink(goal.url) )
						.text(goal.title) 
				)
		);
		var lat = parseFloat(goal.map.lat) + ( (Math.random() -0.5)/100 );
		var lng = parseFloat(goal.map.lng) + ( (Math.random() -0.5)/100 );
		goal.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng), icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"});
		goal.map.marker.setMap(this.data.map);
		personData.data.wishedGoals.push(goal);
		goal.map.infoWindow = new google.maps.InfoWindow({ content: goal.title });
		google.maps.event.addListener(goal.map.marker, 'click', function() {
				goal.map.infoWindow.open(personData.data.map, goal.map.marker);
			  	window.setTimeout(function(){ goal.map.infoWindow.setMap(null); } ,3000);
			  });
		
	},
	addParticipatedGoal: function(goal){
		$("#personParticipatedGoalsWrapper").append(
				$("<li />").append(
						$("<a />").attr("href", getGSGoalLink(goal.url) )
						.text(goal.title) 
				)
		);
		var lat = parseFloat(goal.map.lat) + ( (Math.random() -0.5)/100 );
		var lng = parseFloat(goal.map.lng) + ( (Math.random() -0.5)/100 );
		goal.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng), icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"});
		goal.map.marker.setMap(this.data.map);
		personData.data.participatedGoals.push(goal);
		goal.map.infoWindow = new google.maps.InfoWindow({ content: goal.title });
		google.maps.event.addListener(goal.map.marker, 'click', function() {
				goal.map.infoWindow.open(personData.data.map, goal.map.marker);
			  	window.setTimeout(function(){ goal.map.infoWindow.setMap(null); } ,3000);
			  });
		
	},
	addIssues: function(issue){
		var lat = parseFloat(issue.map.lat) + ( (Math.random() -0.5)/100 );
		var lng = parseFloat(issue.map.lng) + ( (Math.random() -0.5)/100 );
		issue.map.marker = new google.maps.Marker({position: new google.maps.LatLng(lat, lng), icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"});
		issue.map.marker.setMap(this.data.map);
		personData.data.participatedGoals.push(issue);
		issue.map.infoWindow = new google.maps.InfoWindow({ content: issue.title });
		google.maps.event.addListener(issue.map.marker, 'click', function() {
			issue.map.infoWindow.open(personData.data.map, issue.map.marker);
			  	window.setTimeout(function(){ issue.map.infoWindow.setMap(null); } ,3000);
			  });
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
				//console.log(data);
			}, {creatorURI: personURI});
		},
		getUserWishedGoals: function(personURI){
		var inst = this;
		goalAPI.queryGoals(function(data){
			$.each(data.goals, function(i, val){
				var goal = val;
				getGEOByURI(val.locationURI, function(data){
					//console.log(data);
					goal.map = {};
						if ( data.geonames.length > 0 ){
							goal.map.lat = data.geonames[0].lat;
							goal.map.lng = data.geonames[0].lng;
						}
						personData.addWishedGoal( goal );
					});
				
			});
			console.log(data);
		}, {wisherURI: personURI});
	},
	getUserParticipatedGoals: function(personURI){
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
						personData.addParticipatedGoal( goal );
					});
			});
			console.log(data);
		}, {participantURI: personURI});
	},
	getUserIssues: function(personURI){
		var inst = this;
		issueAPI.queryIssues(function(data){
			$.each(data.issues, function(i, val){
				var issue = val;
				getGEOByURI(val.locationURI, function(data){
					console.log(data);
					issue.map = {};
						if ( data.geonames.length > 0 ){
							issue.map.lat = data.geonames[0].lat;
							issue.map.lng = data.geonames[0].lng;
						}
						personData.addIssues( issue );
					});
			});
			console.log(data);
		}, {creatorURI: personURI});
	}
		
	}
};





$(document).ready(function(){
	personData.initControls();
	
});