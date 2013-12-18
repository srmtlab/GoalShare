// Issue singleton for storing fetched goals and paging info
var issueDetails = {
	issue: null,
	issuesPage: 1,
	issuesPerPage: 7,
	
	resetIssues: function(){
		this.issue = null;
		this. issuesPage = 1;
	},
	issuesQuery: null,
	
};

// Issue api handles all API calls
var issueAPI = {
		addIssue:function (issueURI, title, description, references, createdDate, creator, creatorURI, locationURI, wisherURI){
					$.ajax("/api/insert_issue.pl", { 
							data: { issueURI: issueURI,
									title: title,
									description: description,
									references: references.join(';'),
									createdDate: createdDate,
									creator: creator,
									creatorURI: creatorURI,
									locationURI: locationURI,
									wisherURI: wisherURI
							}
					}).done(function(){ console.log("done"); });
					},
		linkIssue: function(issueURI, goalURI){
			$.ajax("/api/issue_sollution.pl", { 
					data: { command: "add", 
							issueURI: issueURI,
							goalURI: goalURI}
			});
		},
//		deleteIssue: function(issueURI){
//			if(issueURI && issueURI != ""){
//				$.get("/api/issue.pl", { command: "delete", issueURI: issueURI, deleteConfirmation: "deleteTrue"} );
//			}
//		}
		deleteIssue: function(issueURI){
			if(issueURI && issueURI != ""){
				$.ajax("/api/issue.pl", { 
					async: false,
					data: { command: "delete", issueURI: issueURI, deleteConfirmation: "deleteTrue" }
				});	
			
			}
		}
					
};

var issueMaps = {
	centerLat: 35.1815,
	centerLng: 136.9064,
	defZoom: 10,
	resetDetailMap: function(){
		
			this.detailMap = new google.maps.Map(document.getElementById("issue_detail-map-canvas"),
			{center: new google.maps.LatLng(this.centerLat, this.centerLng),zoom: this.defZoom});
		
		},
	setDetailMap: function(lat, lng, id){
		if(!this.detailMap)
			this.resetDetailMap();
		var loc = new google.maps.LatLng(lat, lng);
		this.detailMap.setCenter(loc);
	},
	resetCreateMap: function(){
		
		this.createMap = new google.maps.Map(document.getElementById("issue-map-canvas"),
		{center: new google.maps.LatLng(this.centerLat, this.centerLng),zoom: this.defZoom});
	
	},
	setCreateMapMap: function(lat, lng, id){
		this.createMap = new google.maps.Map(document.getElementById("issue-map-canvas"),
				{center: new google.maps.LatLng(lat, lng),zoom: this.defZoom});
	}
		
};
var issueRequests = {
	filterLocation: null	
};

function resetIssueEditSelection(){
	$("#issueTitleEdit").val("");
	$("#issueDescriptionEdit").val("");
	$("#issueCreatedDateEdit").datepicker("setDate", new Date());
	$("#issueReferenceEdit").val("");
	$("#issueRegionEdit").val("");
	$('#issueReferenceList option').remove();
	$('#issueLocationResults option').remove();
	issueCreateMap = new google.maps.Map(document.getElementById("issue-map-canvas"), {center: new google.maps.LatLng(35.1815, 136.9064), zoom: issueMaps.defZoom});
}

 



function openIssueEdit(issueURI){
	resetIssueEditSelection();
	var editIssueURI = issueURI;
	var result = {};
	locationURI = null;
	creatorURI = null;
	title = null;
	description = null;
	wisherURI = null;
	createdDate = null;
	var wisherUser = null;
	
	var editIssue = null;
	if(editIssueURI){
	$.ajax("/api/get_issue.pl", {
		async:false,
		data: {  issueURI: issueURI}
		}).done(function(data){
				editIssue = data; 
		}
		);
	$.ajax("/api/issue_references.pl", {
		async:false,
		data: { command: "get", 
				issueURI: issueURI}
		}).done(function(data){
			$("#issueReferencesDataholder").children().remove();
			if(data.references){
				for( var i = 0 ; i < data.references.length ; i++ ){
					console.log(data.references[i].reference);
					$("#issueReferenceList")
					.append($("<option />").text( data.references[i].reference ));
				}
			}
		});
		console.log(editIssue);
		locationURI = editIssue.locationURI;
		creatorURI = editIssue.creatorURI;
		title = editIssue.title;
		description = editIssue.description;
		wisherURI = editIssue.wisherURI;
		createdDate = editIssue.createdDate;
		if(wisherURI)
			wisherUser = userAPI.getUserByURI(wisherURI);
	}
	$("#issueEditDialogContent").dialog({
		modal: true,
		width: 'auto',
		height: 'auto',
		close: function(event, ui){
			//$("#goalEditDialogContent").show();
		 },
		 closeOnEscape: true,
		 open: function(){
			 $("#issueWisherEdit").autocomplete({source: usersAutocomplete,
					select: function(event, ui){
					// Set autocomplete element to display the label
					      this.value = ui.item.label;
					      // Store value in hidden field
					      $('#selectedIssueWisherURI').val(ui.item.value);
					      // Prevent default behaviour
					      return false;
							}
						});
		 },
		 buttons: [ {
			 			text: Locale.dict.Act_Create,
						click: function(){
							var refList = [];
							var issueInsertURI = "http://collab.open-opinion.org/resource/Issue/" + guid();
							if(editIssue){
								console.log("delete")
								issueInsertURI = editIssueURI;
								issueAPI.deleteIssue(editIssueURI);
							}
							$( "#issueReferenceList option").each(function(key, item){refList.push($(item).val());});
				 			console.log("add issue");
							issueAPI.addIssue(issueInsertURI,
				 					$("#issueTitleEdit").val(),
				 					$("#issueDescriptionEdit").val(),
				 					refList,
				 					//(new Date( Date.parse($("#issueCreatedDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					(new Date().format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					user.name,
				 					user.URI,
				 					"http://sws.geonames.org/"+$("#issueLocationResults").children("option:selected").data("geoid")+"/",				 					
				 					$('#selectedIssueWisherURI').val());
							resetIssueEditSelection();
							$(this).dialog("close");
			 			}
		 			},
		 			{
		 				text: Locale.dict.Act_Cancel,
						click: function(){
			 				$(this).dialog("close");
		 				}
		 			}
		 		],
	});
//	var issueCreateMap = new google.maps.Map(document.getElementById("issue-map-canvas"), {center: new google.maps.LatLng(34.397, 136.9064), zoom: issueMaps.defZoom});
//	setCreateMapMap
	issueMaps.resetCreateMap();
	$("#issueRegionEdit").keyup(function(data){
		searchGEO($("#issueRegionEdit").val(), function(data){
			if(data){
				console.log(data);
				$("#issueLocationResults").children().remove();
				
				for(var i = 0; i < data.geonames.length; i++){
					if( i==0 ){
//						var loc = new google.maps.LatLng(data.geonames[i].lat,data.geonames[i].lng);
//						issueCreateMap.setCenter(loc);
						issueMaps.setCreateMapMap(data.geonames[i].lat,data.geonames[i].lng, data.geonameId);
						
					}
					$("#issueLocationResults")
								.append(
									$("<option />").text(data.geonames[i].name)
									.attr("id", data.geonames[i].geonameId)
									.data("geoid", data.geonames[i].geonameId)
									.data("name", data.geonames[i].name)
									.data("lat", data.geonames[i].lat)
									.data("lng", data.geonames[i].lng)
									).change(function(){
										//console.log(this);
//										var loc = new google.maps.LatLng($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"));
//										issueCreateMap.setCenter(loc);
										issueMaps.setCreateMapMap($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"), data.geonameId);
									});
				}
			}
		});
	});// End keyup
	if (locationURI){
		console.log(locationURI);
		getGEOByURI(locationURI, function(data){
				console.log("location");
						var t = data;
						$("#issueRegionEdit").val(data.name);
						//console.log(data);
						$("#issueLocationResults").children().remove();
						// Add select options
						goalMaps.setCreateMap(data.lat,data.lng, data.geonameID);
						$("#issueLocationResults")
									.append(
										$("<option />").text(data.name)
										.attr("id", data.geonameId)
										.data("geoid", data.geonameId)
										.data("name", data.name)
										.data("lat", data.lat)
										.data("lng", data.lng)
										);								
						}); 
	}else{
		$("#issueRegionEdit").val("名古屋市");
		$("#issueRegionEdit").keyup();
	}
	console.log(title);
	if(title)
		$("#issueTitleEdit").val(title);
	console.log(description);
	if(description){
		$("#issueDescriptionEdit").val(description);
	}
	console.log(createdDate);
	if(createdDate){
		$("#issueCreatedDateEdit").datepicker("setDate", new Date( Date.parse(createdDate) ));
	}
	if (wisherUser){
		console.log(wisherUser.name);
		$('#issueWisherEdit').val(user.translateUser(wisherUser.name));
		$('#selectedIssueWisherURI').val(wisherURI);
	}else
	{
		$('#issueWisherEdit').val(user.translateUser(user.name));
		$('#selectedIssueWisherURI').val(user.URI);
	}
}
var debug;
//Displays goal details
function displayIssueDetails(issueURI){
	//issueDetails.resetRelatedGoals();
	//http://localhost/api/get_issue.pl?issueURI=http://collab.open-opinion.org/resource/Issue/f574c263-ee83-1f2a-7009-a942b6080a17
	var localIssueURI = issueURI; 
	$("#issueDetailBody").children().remove();
	$.getJSON("/api/get_issue.pl", { issueURI: issueURI },function(data){
			if(data){
				var issueData = data;
				var wisher = userAPI.getUserByURI(data.wisherURI);
				
				var creator = userAPI.getUserByURI(data.wisherURI);
				//console.log(issueURI);
				// Goal data loaded, display template
				$("#issueDetailBody").loadTemplate("templates/issueDetailTemplate.html", { 
						issueURI: data.issueURI,
						title: data.title,
						description: data.description,
						createdDate: (data.createdDate)? formatDate( data.createdDate ) : " -",
						creatorURI: data.creatorURI,
						creatorName: data.creatorName,
						creatorImageURI: (data.creatorImageURI)?data.creatorImageURI:"image/nobody.png",
						locationURI: data.locationURI,
						wisherURI: data.wisherURI,
						wisherName: (wisher)? wisher.name:"",
						wisherImageURI: (wisher)?wisher.imageURI:"image/nobody.png"
				},{ isFile: true,
					success: function(){
						// Fetch the map location to center the map
						issueMaps.resetDetailMap();
						getGEOByURI(data.locationURI, function(data){
							if (data)
								issueMaps.setDetailMap(data.lat, data.lng, data.geonameId);
						});
						
						$.ajax("/api/issue_sollution.pl", { 
							data: { command: "get", 
									issueURI: localIssueURI}
							}).done(function(data){
								debug = data;
								$("#issueSolutionDataholder").children().remove();
								if( data.solutions && data.solutions.length > 0){
									$("#issueSolutionDataholder").append(
											$("<a />").attr("href", data.solutions[0].goalURI)
														.append($("<span />").text(data.solutions[0].title))
										).append("<br />");
									$("#issueToGoal").prop("disabled", true);
								}else{
									$("#issueToGoal").prop("disabled", false);
								}
								
							});
						$.ajax("/api/issue_references.pl", { 
							data: { command: "get", 
									issueURI: localIssueURI}
							}).done(function(data){
								$("#issueReferencesDataholder").children().remove();
								if(data.references){
									for( var i = 0 ; i < data.references.length ; i++ ){
										$("#issueReferencesDataholder").append(
												$("<a />").attr("href", data.references[i].reference)
															.append($("<span />").text(data.references[i].reference))
											);
									}
								}
							});
						
						$("#issueToGoal").click(function(){
							// Open goal creation dialog
							//console.log("Create solution");

							var refURI = $("#issueDetailURIHolder").val();// $(this).parent().find(".issueID")[0] ).val();
							var title = issueData.title;
							console.log(refURI);
							var title = "";
							if(Locale.currentLanguage == "jp"){
								title = "「" + issueData.title + "」を解決する"
							}
							else{
								title = "Solving: \"" +issueData.title + "\"" 
							}
							console.log(wisher.name);
							openGoalEdit(null, null, refURI, title, null, issueData.locationURI, issueData.wisherURI, wisher.name);
						});
						//getSubgoalDetails(goalURI);
						
						//getCollaborators(goalURI);
						 
					}
				});
			}
		});
	
	
}

/* Displays a page of issues */
function displayIssues(page){
	//console.log(page);
	issueDetails.issuesPage = page;

	if( issueDetails.issues ){
		// TODO add no issues text
		$("#issueListPlaceholder").loadTemplate("templates/issueResourceTemplate.html", issueDetails.issues, { 
					paged: true, 
					elemPerPage: issueDetails.issuesPerPage, 
					pageNo: page,
					isFile: true,
					success: function(){
						localizeUI();
						if( issueDetails.issues.length <= (issueDetails.issuesPerPage * issueDetails.issuesPage )){
							$("#issuesPagerNext").attr('disabled', 'disabled');
						}else{
							$("#issuesPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#issuesPagerPrev").attr('disabled', 'disabled');
						else
							$("#issuesPagerPrev").removeAttr('disabled');
						
						$("div.resource.issue").click(function(){
							var URI = $($(this).find(".issueID")[0]).val();
							$("div.resource.issue").removeClass("selected");
							$(this).addClass("selected");
							displayIssueDetails(URI);
						});
						$(".deleteIssue").click(function(){
							var issueURI = $(this).data("target-issue-uri");
							console.log("delete + "+ issueURI);
//							var r=confirm(Locale.dict.DeleteConfirm);
//							if (r==true)
//						  {
//							  	issueAPI.deleteIssue(issueURI);
//						  }
							$('<div></div>').appendTo('body')
					        .html('<div><h6>' + Locale.dict.DeleteConfirm + '</h6></div>')
					        .dialog({
					            modal: true, title: Locale.dict.DeleteConfirm, zIndex: 10000, autoOpen: true,
					            width: 'auto', resizable: false,
					            buttons: {
					                Yes: function () {
					                	issueAPI.deleteIssue(issueURI);
					                    $(this).dialog("close");
					                },
					                No: function () {
					                    $(this).dialog("close");
					                }
					            },
					            close: function (event, ui) {
					                $(this).remove();
					            }
					        });
							return false;
						});
						
						$(".editIssue").click(function(){
							var issueURI = $(this).data("target-issue-uri");
							console.log("edit "+ issueURI);
							openIssueEdit(issueURI)
							return false;
						});
						$("#issueToGoal").click(function(){
							// Open goal creation dialog
							console.log("Create solution");

							var refURI = $("#issueDetailURIHolder").val();// $(this).parent().find(".issueID")[0] ).val();
							console.log(refURI);
							openGoalEdit(null, null, refURI);
						});
					
					},
					errorMessage: "Error"
				});// Load template
	}
}
function fetchIssuesComplete(data) {
		issueDetails.resetIssues();
		var issues = [];
		$.each(data.issues, function(key, val){
			issues.push({
				issueURI: val.issueURI,
				description: val.description,
				title: val.title,
				creatorName: val.creator,
				creatorURI: val.creatorURI,
				creatorImageURI: (val.creatorImageURI)? val.creatorImageURI : "image/nobody.png",
				createdDate: Locale.dict.CreatedDate + ": " + formatDate(val.dateSubmitted),
				imageURI: (!val.wisherImageURI)? val.creatorImageURI: val.wisherImageURI 
			});
		});
		issueDetails.issues = issues;
		displayIssues(1);
}

function setupIssueFilters() {
	var today = new Date();
	var prev = new Date();
	prev.setDate(today.getDate() - 60);
	$("#issueCreatedDateEdit").datepicker();

	$("#issueStartDate").datepicker({
		buttonImage : "calendar.gif",
		buttonText : Locale.dict.Calendar,
		altFormat : "dd.mm.yy",
		dateFormat: Locale.dict.X_DateFormatJQ
	}).datepicker("setDate", prev);

	$("#issueEndDate").datepicker({
		buttonImage : "calendar.gif",
		buttonText : Locale.dict.Calendar,
		altFormat : "dd.mm.yy",
		dateFormat: Locale.dict.X_DateFormatJQ
	}).datepicker("setDate", today);

	$("#issueCreatedBy").autocomplete();
	
	// Setup location search for the filter
	$("#issueLocationFilterSearch").keyup(function(){
		if($("#issueLocationFilterSearch").val() == "" ){
			$("#issueFilterLocation").children().remove();
		}else
			{
			searchGEO($("#issueLocationFilterSearch").val(), function(data){
				if(data){
					console.log(data);
					$("#issueFilterLocation").children().remove();
					if($("#issueLocationFilterSearch").val() != "" ){
					for(var i = 0; i < data.geonames.length; i++){
						if( i==0 ){
							//var loc = new google.maps.LatLng(data.geonames[i].lat,data.geonames[i].lng);
							//issueCreateMap.setCenter(loc);
						}
						$("#issueFilterLocation")
									.append(
										$("<option />").text(data.geonames[i].name)
										.attr("id", data.geonames[i].geonameId)
										.data("geoid", data.geonames[i].geonameId)
										.data("value", "http://sws.geonames.org/" + data.geonames[i].geonameId)
										.data("name", data.geonames[i].name)
										.data("lat", data.geonames[i].lat)
										.data("lng", data.geonames[i].lng)
										).change(function(){
											//console.log(this);
											//var loc = new google.maps.LatLng($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"));
											//issueCreateMap.setCenter(loc);
										});
					}
					}
				}
			});	
		}
	});

	$.getJSON("/api/autocomplete.pl", { type: "creators", data: "issue" },
			function(data){
				$("#issueCreatedBy").autocomplete({source: data.Creators});
			});
	$("#issueFilterSubmit").click(
			function() {
				if(!user.checkLoginStatus()){
					alert(Locale.dict.AskLoginMessage);
					return;
				}
				// issueListWrapper
				$(".pagerButton").css("display", "auto");
				$("#issueListWrapper").children().remove();					
				var qData = {};
				qData["startTime"] = (new Date( Date.parse($("#issueStartDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
				qData["endTime"] = (new Date( Date.parse($("#issueEndDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
				qData["num"] = $("#issueResultLimit").val();
				qData["created"] = $("#issueCreatedBy").val();
				qData["keyword"] = $("#issueKeyword").val();
				if($("#issueFilterLocation option:selected").data("value"))
					qData["locationURI"] = $("#issueFilterLocation option:selected").data("value")+"/";
				$.getJSON("/api/query_issues.pl", qData, fetchIssuesComplete);
			});
}


function setupIssueCommands(){
	
		
	$("li.issue").click(function(){$("#issueFilterSubmit").click();});
		$("#issueCreate").click(function(){
			//if(!user.checkLoginStatus){
				//alert(Locale.dict.AskLoginMessage);
				//return;
			//}
			openIssueEdit();
		});
		$("#issuesPagerNext").click(function(){
			displayIssues(issueDetails.issuesPage + 1);
		});
		$("#issuesPagerPrev").click(function(){
			displayIssues(issueDetails.issuesPage - 1);	
		});		
		$("#issueAddReference").click(function(){
			if( $("#issueReferenceEdit").val() != ""){
				$("#issueReferenceList")
					.append($("<option />").text( $("#issueReferenceEdit").val() ));
			}
			$("#issueReferenceEdit").val("");
			return false;
		});
		
		$("#issueRemoveReference").click(function(){
			$('#issueReferenceList option:selected')
		    .remove();
			return false;
		});
		
}
