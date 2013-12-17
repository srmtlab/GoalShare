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
		addIssue:function (issueURI, title, description, references, createdDate, creator, creatorURI, locationURI){
					$.ajax("/api/insert_issue.pl", { 
							data: { issueURI: issueURI,
									title: title,
									description: description,
									references: references.join(';'),
									createdDate: createdDate,
									creator: creator,
									creatorURI: creatorURI,
									locationURI: locationURI		
							}
					}).done(function(){ console.log("done"); });
					},
		linkIssue: function(issueURI, goalURI){
			$.ajax("/api/issue_sollution.pl", { 
					data: { command: "add", 
							issueURI: issueURI,
							goalURI: goalURI}
			});
		}			
};

var issueMaps = {
	centerLat: 35.1815,
	centerLng: 136.9064,
	resetDetailMap: function(){
		
			this.detailMap = new google.maps.Map(document.getElementById("issue_detail-map-canvas"),
			{center: new google.maps.LatLng(this.centerLat, this.centerLng),zoom: 8});
		
		},
	setDetailMap: function(lat, lng, id){
		if(!this.detailMap)
			this.resetDetailMap();
		var loc = new google.maps.LatLng(lat, lng);
		this.detailMap.setCenter(loc);
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
	issueCreateMap = new google.maps.Map(document.getElementById("issue-map-canvas"), {center: new google.maps.LatLng(35.1815, 136.9064), zoom: 8});
}

 



function openIssueEdit(){
	resetIssueEditSelection();
	$("#issueEditDialogContent").dialog({
		modal: true,
		width: 'auto',
		height: 'auto',
		close: function(event, ui){
			//$("#goalEditDialogContent").show();
		 },
		 closeOnEscape: true,
		 open: function(){},
		 buttons: [ {
			 			text: Locale.dict.Act_Create,
						click: function(){
							var refList = [];
							$( "#issueReferenceList option").each(function(key, item){refList.push($(item).val());});
				 			issueAPI.addIssue("http://collab.open-opinion.org/resource/Issue/" + guid(),//$("#issueTitleEdit").val() + Math.round((new Date()).getTime() / 1000)+"IS",
				 					$("#issueTitleEdit").val(),
				 					$("#issueDescriptionEdit").val(),
				 					refList,
				 					//(new Date( Date.parse($("#issueCreatedDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					(new Date().format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					user.name,
				 					user.URI,
				 					"http://sws.geonames.org/"+$("#issueLocationResults").children("option:selected").data("geoid")+"/"				 					
				 					);
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
	var issueCreateMap = new google.maps.Map(document.getElementById("issue-map-canvas"), {center: new google.maps.LatLng(34.397, 136.9064), zoom: 8});
	
	$("#issueRegionEdit").keyup(function(data){
		searchGEO($("#issueRegionEdit").val(), function(data){
			if(data){
				console.log(data);
				$("#issueLocationResults").children().remove();
				
				for(var i = 0; i < data.geonames.length; i++){
					if( i==0 ){
						var loc = new google.maps.LatLng(data.geonames[i].lat,data.geonames[i].lng);
						issueCreateMap.setCenter(loc);
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
										var loc = new google.maps.LatLng($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"));
										issueCreateMap.setCenter(loc);
									});
				}
			}
		});
	});// End keyup
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
						locationURI: data.locationURI
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
							console.log("Create solution");

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
							openGoalEdit(null, null, refURI, title);
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
				imageURI: (!val.wisherImageURI)? val.creatorImageURI: wisherImageURI 
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
