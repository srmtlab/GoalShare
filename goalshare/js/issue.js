/**
 * Issue related functionality
 */
// Issue singleton for storing fetched goals and paging info
var issueDetails = {
	issue : null,
	issuesPage : 1,
	issuesPerPage : 7,

	resetIssues : function() {
		this.issue = null;
		this.issuesPage = 1;
	},
	issuesQuery : null,

};

// Issue api handles all API calls
var issueAPI = {
	addIssue : function(issueURI, title, description, references, createdDate,
			creator, creatorURI, locationURI, wisherURI) {
		$.ajax("/api/insert_issue.pl", {
			data : {
				issueURI : issueURI,
				title : title,
				description : description,
				references : references.join(';'),
				createdDate : createdDate,
				creator : creator,
				creatorURI : creatorURI,
				locationURI : locationURI
			}
		}).done(function() {
			console.log("done");
		});
	},
	linkIssue : function(issueURI, goalURI) {
		$.ajax("/api/issue_sollution.pl", {
			data : {
				command : "add",
				issueURI : issueURI,
				goalURI : goalURI
			}
		});
	},
	deleteIssue : function(issueURI) {
		if (issueURI && issueURI != "") {
			$.ajax("/api/issue.pl", {
				async : false,
				data : {
					command : "delete",
					issueURI : issueURI,
					deleteConfirmation : "deleteTrue"
				}
			});
		}
	}
};
// Object containing issue map functionality
var issueMaps = {
	centerLat : 35.1815,
	centerLng : 136.9064,
	defZoom : 10,
	resetDetailMap : function() {

		this.detailMap = new google.maps.Map(document
				.getElementById("issue_detail-map-canvas"), {
			scrollwheel : false,
			navigationControl : false,
			mapTypeControl : false,
			scaleControl : false,
			draggable : false,
			center : new google.maps.LatLng(this.centerLat, this.centerLng),
			zoom : this.defZoom
		});

	},
	setDetailMap : function(lat, lng, id, name) {
		this.detailMap = new google.maps.Map(document
				.getElementById("issue_detail-map-canvas"), {
			scrollwheel : false,
			navigationControl : false,
			mapTypeControl : false,
			scaleControl : false,
			draggable : false,
			center : new google.maps.LatLng(lat, lng),
			zoom : this.defZoom
		});
		if (name)
			$("#issueDetailMapTitle").text(name);
	},
	resetCreateMap : function() {

		this.createMap = new google.maps.Map(document
				.getElementById("issue-map-canvas"), {
			scrollwheel : false,
			navigationControl : false,
			mapTypeControl : false,
			scaleControl : false,
			draggable : false,
			center : new google.maps.LatLng(this.centerLat, this.centerLng),
			zoom : this.defZoom
		});

	},
	setCreateMapMap : function(lat, lng, id) {
		this.createMap = new google.maps.Map(document
				.getElementById("issue-map-canvas"), {
			scrollwheel : false,
			navigationControl : false,
			mapTypeControl : false,
			scaleControl : false,
			draggable : false,
			center : new google.maps.LatLng(lat, lng),
			zoom : this.defZoom
		});
	}

};
// Object storing current http requests
var issueRequests = {
	filterLocation : null
};

// Reset edit selection
function resetIssueEditSelection() {
	$("#issueTitleEdit").val("");
	$("#issueDescriptionEdit").val("");
	$("#issueCreatedDateEdit").datepicker("setDate", new Date());
	$("#issueReferenceEdit").val("");
	$("#issueRegionEdit").val("");
	$('#issueReferenceList option').remove();
	$('#issueLocationResults option').remove();
	issueCreateMap = new google.maps.Map(document
			.getElementById("issue-map-canvas"), {
		scrollwheel : false,
		navigationControl : false,
		mapTypeControl : false,
		scaleControl : false,
		draggable : false,
		center : new google.maps.LatLng(35.1815, 136.9064),
		zoom : issueMaps.defZoom
	});
}

function openIssueEdit(issueURI) {
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
	if (editIssueURI) {
		$.ajax("/api/get_issue.pl", {
			async : false,
			data : {
				issueURI : issueURI
			}
		}).done(function(data) {
			editIssue = data;
		});
		$.ajax("/api/issue_references.pl", {
			async : false,
			data : {
				command : "get",
				issueURI : issueURI
			}
		}).done(
				function(data) {
					$("#issueReferencesDataholder").children().remove();
					if (data.references) {
						for ( var i = 0; i < data.references.length; i++) {
							console.log(data.references[i].reference);
							$("#issueReferenceList").append(
									$("<option />").text(
											data.references[i].reference));
						}
					}
				});
		console.log(editIssue);
		locationURI = editIssue.locationURI;
		creatorURI = editIssue.creatorURI;
		title = editIssue.title;
		description = editIssue.description;
		createdDate = editIssue.createdDate;
	}
	$("#issueCreateSubmit").click(function() {
						var refList = [];
						var issueInsertURI = "http://collab.open-opinion.org/resource/Issue/"
								+ guid();
						if (editIssue) {
							issueInsertURI = editIssueURI;
							issueAPI.deleteIssue(editIssueURI);
						}
						$("#issueReferenceList option")
								.each(
										function(key, item) {
											refList
													.push($(
															item)
															.val());
										});
						console.log("add issue");
						issueAPI
								.addIssue(
										issueInsertURI,
										$("#issueTitleEdit")
												.val(),
										$(
												"#issueDescriptionEdit")
												.val(),
										refList,
										(new Date()
												.format(Locale.dict.X_FullDateFormat))
												+ getTimezoneOffset(),
										user.name,
										user.URI,
										geoLOD
												.getURI($(
														"#issueLocationResults")
														.children(
																"option:selected")
														.data(
																"geoid")),
										null
								);
						resetIssueEditSelection();
						$('#createIssueWrapper').slideUp();
						$("#issueFilterSubmit").click();
					});
								
	

	// setCreateMapMap
	issueMaps.resetCreateMap();
	// Location filter search
	$("#issueRegionEdit")
			.keyup(
					function(data) {
						geoLOD.searchGEO(
										$("#issueRegionEdit").val(),
										function(data) {
											if (data) {
												console.log(data);
												$("#issueLocationResults")
														.children().remove();

												for ( var i = 0; i < data.geonames.length; i++) {
													if (i == 0) {
														issueMaps
																.setCreateMapMap(
																		data.geonames[i].lat,
																		data.geonames[i].lng,
																		data.geonameId);

													}
													$("#issueLocationResults")
															.append(
																	$(
																			"<option />")
																			.text(
																					data.geonames[i].name)
																			.attr(
																					"id",
																					data.geonames[i].geoid)
																			.data(
																					"geoid",
																					data.geonames[i].geoid)
																			.data(
																					"name",
																					data.geonames[i].name)
																			.data(
																					"lat",
																					data.geonames[i].lat)
																			.data(
																					"lng",
																					data.geonames[i].lng))
															.change(
																	function() {
																		issueMaps
																				.setCreateMapMap(
																						$(
																								this)
																								.children(
																										"option:selected")
																								.data(
																										"lat"),
																						$(
																								this)
																								.children(
																										"option:selected")
																								.data(
																										"lng"),
																						data.geonameId);
																	});
												}
											}
										});
					});// End keyup
	if (locationURI) {
		console.log(locationURI);
		getGEOByURI(locationURI, function(data) {
			var t = data;
			$("#issueRegionEdit").val(data.geonames[0].name);
			$("#issueLocationResults").children().remove();
			// Add select options
			issueMaps.setCreateMapMap(data.geonames[0].lat,
					data.geonames[0].lng, data.geonames[0].geonameID);
			$("#issueLocationResults").append(
					$("<option />").text(data.geonames[0].name).attr("id",
							data.geonames[0].geoid).data("geoid",
							data.geonames[0].geoid).data("name",
							data.geonames[0].name).data("lat",
							data.geonames[0].lat).data("lng",
							data.geonames[0].lng).data("uri",
							data.geonames[0].URI));
		});
	} else {
		// Default location
		$("#issueRegionEdit").val("名古屋市");
		$("#issueRegionEdit").keyup();
	}
	if (title)
		$("#issueTitleEdit").val(title);
	if (description) {
		$("#issueDescriptionEdit").val(description);
	}
	if (createdDate) {
		$("#issueCreatedDateEdit").datepicker("setDate",
				new Date(Date.parse(createdDate)));
	}
	$('#createIssueWrapper').slideDown();
}
var debug;
// Displays goal details
function displayIssueDetails(issueURI) {	
	var localIssueURI = issueURI;
	$("#issueDetailBody").children().remove();
	$.getJSON(
					"/api/get_issue.pl",
					{
						issueURI : issueURI
					},
					function(data) {
						if (data) {
							var issueData = data;
							var creator = userAPI.getUserByURI(data.creatorURI);
							// Issue data loaded, display template
							$("#issueDetailBody")
									.loadTemplate(
											"templates/issueDetailTemplate.html",
											{
												issueURI : data.issueURI,
												title : data.title,
												description : data.description,
												createdDate : (data.createdDate) ? formatDate(data.createdDate)
														: " -",
												creatorURI : data.creatorURI,
												creatorName : user
														.translateUser(data.creatorName),
												creatorImageURI : (data.creatorImageURI) ? data.creatorImageURI
														: "image/nobody.png",
												locationURI : data.locationURI,
												goalShareIssueURI: window.location.origin + window.location.pathname + "?lang=" + Locale.currentLanguage + "&showIssue=" + localIssueURI + "#issue"
											},
											{
												isFile : true,
												success : function() {
													// Fetch the map location to
													// center the map
													issueMaps.resetDetailMap();
													getGEOByURI(
															data.locationURI,
															function(data) {
																if (data)
																	issueMaps
																			.setDetailMap(
																					data.geonames[0].lat,
																					data.geonames[0].lng,
																					data.geonames[0].geonameId,
																					data.geonames[0].name);
															});

													$.ajax(
																	"/api/issue_sollution.pl",
																	{
																		data : {
																			command : "get",
																			issueURI : localIssueURI
																		}
																	})
															.done(
																	function(
																			data) {
																		debug = data;
																		$(
																				"#issueSolutionDataholder")
																				.children()
																				.remove();
																		if (data.solutions
																				&& data.solutions.length > 0) {
																			$(
																					"#issueSolutionDataholder")
																					.append(
																							$(
																									"<a />")
																									.attr(
																											"href",
																											data.solutions[0].goalURI)
																									.append(
																											$(
																													"<span />")
																													.text(
																															data.solutions[0].title)))
																					.append(
																							"<br />");
																			$(
																					"#issueToGoal")
																					.prop(
																							"disabled",
																							true);
																		} else {
																			$(
																					"#issueToGoal")
																					.prop(
																							"disabled",
																							false);
																		}

																	});
													$.ajax(
																	"/api/issue_references.pl",
																	{
																		data : {
																			command : "get",
																			issueURI : localIssueURI
																		}
																	})
															.done(
																	function(
																			data) {
																		$(
																				"#issueReferencesDataholder")
																				.children()
																				.remove();
																		if (data.references) {
																			for ( var i = 0; i < data.references.length; i++) {
																				$(
																						"#issueReferencesDataholder")
																						.append(
																								$(
																										"<a />")
																										.attr(
																												"href",
																												data.references[i].reference)
																										.append(
																												$(
																														"<span />")
																														.text(
																																data.references[i].reference)));
																			}
																		}
																	});

													$("#issueToGoal")
															.click(
																	function() {
																		// Open
																		// goal
																		// creation
																		// dialog
																		$(".visualizer").css("display", "none");
																		$(".visualizer#goal").css("display", "block");
																		$("li.goal").click();
																		var refURI = $(
																				"#issueDetailURIHolder")
																				.val();
																		var title = issueData.title;
																		console
																				.log(issueData);
																		// Default title
																		if (Locale.currentLanguage == "jp"
																				|| Locale.currentLanguage == "ja") {
																			title = "「"
																					+ issueData.title
																					+ "」を解決する";
																		} else {
																			title = "Solving: \""
																					+ issueData.title
																					+ "\"";
																		}
																		console
																				.log(title);
																		openGoalEdit(
																				null,
																				null,
																				refURI,
																				title,
																				null,
																				issueData.locationURI,
																				null,
																				user
																						.translateUser(wisher.name));
																	});
												}
											});
						}
					});

}

/* Displays a page of issues */
function displayIssues(page, selectFirst) {
	// console.log(page);
	issueDetails.issuesPage = page;

	if (issueDetails.issues) {
		// TODO add no issues text
		$("#issueListPlaceholder")
				.loadTemplate(
						"templates/issueResourceTemplate.html",
						issueDetails.issues,
						{
							paged : true,
							elemPerPage : issueDetails.issuesPerPage,
							pageNo : page,
							isFile : true,
							success : function() {
								localizeUI();
								if (issueDetails.issues.length <= (issueDetails.issuesPerPage * issueDetails.issuesPage)) {
									$("#issuesPagerNext").attr('disabled',
											'disabled');
								} else {
									$("#issuesPagerNext")
											.removeAttr('disabled');
								}
								if (page <= 1)
									$("#issuesPagerPrev").attr('disabled',
											'disabled');
								else
									$("#issuesPagerPrev")
											.removeAttr('disabled');

								$("div.resource.issue")
										.click(
												function() {
													var URI = $(
															$(this).find(
																	".issueID")[0])
															.val();
													$("div.resource.issue")
															.removeClass(
																	"selected");
													$(this)
															.addClass(
																	"selected");
													displayIssueDetails(URI);
												});
								$(".deleteIssue")
										.click(
												function() {
													var issueURI = $(this)
															.data(
																	"target-issue-uri");
													console.log("delete + "
															+ issueURI);
													if (user.name == "Anonymous") {
														var buttonsObj2 = {};
														buttonsObj2[Locale.dict.Act_OK] = function() {
															$(this).dialog(
																	"close");
														};

														$('<div></div>')
																.appendTo(
																		'body')
																.html(
																		'<div><h6>'
																				+ Locale.dict.LogIn
																				+ '</h6></div>')
																.dialog(
																		{
																			modal : true,
																			title : Locale.dict.NoPermissionToDelete,
																			zIndex : 10000,
																			autoOpen : true,
																			width : 'auto',
																			resizable : false,
																			buttons : buttonsObj2,
																			close : function(
																					event,
																					ui) {
																				$(
																						this)
																						.remove();
																			}
																		});
													}else{

														var buttonObj = {};
														buttonObj[Locale.dict.Act_Complete] = function() {
															console.log("delete"
																	+ issueURI);
															issueAPI
																	.deleteIssue(issueURI);
															$(this).dialog("close");
															location.reload();
														};
														buttonObj[Locale.dict.Act_Cancel] = function() {
															$(this).dialog("close");
														};
														$('<div></div>')
																.appendTo('body')
																.html(
																		'<div><h6>'
																				+ Locale.dict.DeleteConfirm
																				+ '</h6></div>')
																.dialog(
																		{
																			modal : true,
																			title : Locale.dict.DeleteConfirm,
																			zIndex : 10000,
																			autoOpen : true,
																			width : 'auto',
																			resizable : false,
																			buttons : buttonObj
																		});
													}
													return false;
												});

								$(".editIssue").click(
										function() {
											var issueURI = $(this).data(
													"target-issue-uri");
											console.log("edit " + issueURI);
											openIssueEdit(issueURI);
											return false;
										});
								$(".issueToGoal")
										.click(
												function() {

													// Open goal creation dialog
													console
															.log("Create solution");
													var title = "";
													var refURI = $(this).data(
															"target-goal-uri");
													var issueTitle = $(this)
															.data(
																	"target-goal-title");
													var issueLocation = $(this)
															.data(
																	"target-goal-location");
												
													console.log(issueTitle);

													if (Locale.currentLanguage == "jp"
															|| Locale.currentLanguage == "ja") {
														title = "「"
																+ issueTitle
																+ "」を解決する";
													} else {
														title = "Solving: \""
																+ issueTitle
																+ "\"";
													}
													console
															.log("issue location "
																	+ issueLocation);
													openGoalEdit(null, null,
															refURI, title,
															null,
															issueLocation,
															null, null);
													$(".visualizer").css("display", "none");
													$(".visualizer#goal").css("display", "block");
												});
								
								if (selectFirst)
									$("#issueListPlaceholder > .resource.issue")[0]
											.click();

							},
							errorMessage : "Error"
						});// Load template
	}
}
// Data fetch complete, show issues
function fetchIssuesComplete(data) {
	issueDetails.resetIssues();
	var issues = [];
	$.each(data.issues, function(key, val) {
		issues.push({
			issueURI : val.issueURI,
			description : shortenText(val.description, 60),
			descriptionFull : val.description,
			title : val.title,
			creatorName : user.translateUser(val.creator),
			creatorURI : val.creatorURI,
			creatorImageURI : (val.creatorImageURI) ? val.creatorImageURI
					: "image/nobody.png",
			createdDate : Locale.dict.CreatedDate + ": "
					+ formatDate(val.dateSubmitted),
			imageURI : (!val.wisherImageURI) ? val.creatorImageURI
					: val.wisherImageURI,
			locationURI : val.locationURI
		});
	});
	issueDetails.issues = issues;
	displayIssues(1, true);
}

// Setup filter functionality
function setupIssueFilters() {
	var today = new Date();
	var prev = new Date();
	prev.setDate(today.getDate() - 30);
	$("#issueCreatedDateEdit").datepicker();

	$("#issueStartDate").datepicker({
		buttonImage : "calendar.gif",
		buttonText : Locale.dict.Calendar,
		altFormat : "dd.mm.yy",
		dateFormat : Locale.dict.X_DateFormatJQ
	}).datepicker();// "setDate", prev);

	$("#issueEndDate").datepicker({
		buttonImage : "calendar.gif",
		buttonText : Locale.dict.Calendar,
		altFormat : "dd.mm.yy",
		dateFormat : Locale.dict.X_DateFormatJQ
	}).datepicker();// "setDate", today);

	$("#issueCreatedBy").autocomplete();

	// Setup location search for the filter
	$("#issueLocationFilterSearch")
			.keyup(
					function() {
						$("#issueFilterLocation").children().remove();
						if ($("#issueLocationFilterSearch").val() == "") {
							$("#issueFilterLocation").children().remove();
						} else {
							geoLOD
									.searchGEO(
											$("#issueLocationFilterSearch")
													.val(),
											function(data) {
												if (data) {
													console.log(data);
													$("#issueFilterLocation")
															.children()
															.remove();
													if ($(
															"#issueLocationFilterSearch")
															.val() != "") {
														for ( var i = 0; i < data.geonames.length; i++) {
															$(
																	"#issueFilterLocation")
																	.append(
																			$(
																					"<option />")
																					.text(
																							data.geonames[i].name)
																					.attr(
																							"id",
																							data.geonames[i].geonameId)
																					.data(
																							"geoid",
																							data.geonames[i].geonameId)
																					.data(
																							"value",
																							data.geonames[i].URI)
																					.data(
																							"uri",
																							data.geonames[i].URI)
																					.data(
																							"name",
																							data.geonames[i].name)
																					.data(
																							"lat",
																							data.geonames[i].lat)
																					.data(
																							"lng",
																							data.geonames[i].lng));
														}
													}
												}
											});
							searchGEO(
									$("#issueLocationFilterSearch").val(),
									function(data) {
										if (data && data.geonames) {
											if ($("#issueLocationFilterSearch")
													.val() != "") {
												for ( var i = 0; i < data.geonames.length; i++) {
													if (i == 0) {
													}
													$("#issueFilterLocation")
															.append(
																	$(
																			"<option />")
																			.text(
																					data.geonames[i].name)
																			.attr(
																					"id",
																					data.geonames[i].geonameId)
																			.data(
																					"geoid",
																					data.geonames[i].geonameId)
																			.data(
																					"value",
																					data.geonames[i].URI)
																			.data(
																					"uri",
																					data.geonames[i].URI)
																			.data(
																					"name",
																					data.geonames[i].name)
																			.data(
																					"lat",
																					data.geonames[i].lat)
																			.data(
																					"lng",
																					data.geonames[i].lng));
												}
											}
										}
									});
						}
					});

	$.getJSON("/api/autocomplete.pl", {
		type : "creators",
		data : "issue"
	}, function(data) {
		$("#issueCreatedBy").autocomplete({
			source : data.Creators
		});
	});
	$("#expandIssueFilter").click(
			function() {
				console.log("Filter");
				if ($("#issueHiddenFilter").hasClass("hidden")) {
					$(this).removeClass("right").addClass("left");
					jQuery("#expandIssueFilter").detach().appendTo(
							'#issueHiddenFilter');
					$("#issueHiddenFilter").show('slide', {
						direction : 'left'
					}, 1000).removeClass("hidden");
				} else {
					$(this).removeClass("left").addClass("right");
					jQuery("#expandIssueFilter").detach().appendTo(
							'#issueHiddenFilter');
					$("#issueHiddenFilter").hide(
							'slide',
							{
								direction : 'left'
							},
							1000,
							function() {
								jQuery("#expandIssueFilter").detach().appendTo(
										'#issueBaseFilter');
							}).addClass("hidden");
				}
			});
	$("#issueFilterSubmit").click(
			function() {
				if (!user.checkLoginStatus()) {
					alert(Locale.dict.AskLoginMessage);
					return;
				}
				// issueListWrapper
				$(".pagerButton").css("display", "auto");
				$("#issueListWrapper").children().remove();
				var qData = {};
				qData["startTime"] = (new Date(Date.parse($("#issueStartDate")
						.datepicker().val())).format("yyyy-MM-ddThh:mm:ss"))
						+ getTimezoneOffset();
				qData["endTime"] = (new Date(Date.parse($("#issueEndDate")
						.datepicker().val())).format("yyyy-MM-ddThh:mm:ss"))
						+ getTimezoneOffset();
				qData["num"] = $("#issueResultLimit").val();
				qData["created"] = $("#issueCreatedBy").val();
				qData["keyword"] = $("#issueKeyword").val();

				if ($("#issueFilterLocation option:selected").data("value")) {

					var locList = new Array();
					$("#issueFilterLocation option").each(function(key, item) {
						locList.push($(item).data("uri"));
					});
					qData["locationURI"] = locList.join(",");

					// qData["locationURI"] = $("#issueFilterLocation
					// option:selected").data("value")+"/";
				}
				$.getJSON("/api/query_issues.pl", qData, fetchIssuesComplete);
			});
}

function setupIssueCommands() {
	
	
	$("li.issue").click(function() {
		if ( !$.urlParam("showIssue") )
			$("#issueFilterSubmit").click();
	});
	
	$("#issueCreate").click(function() {
		// if(!user.checkLoginStatus){
		// alert(Locale.dict.AskLoginMessage);
		// return;
		// }
		openIssueEdit();
		
	});
	$("#issueCreateClear").click(function(){
		
		$('#createIssueWrapper').slideUp();
		resetIssueEditSelect();
		return false;
	});
	$("#issuesPagerNext").click(function() {
		displayIssues(issueDetails.issuesPage + 1);
	});
	$("#issuesPagerPrev").click(function() {
		displayIssues(issueDetails.issuesPage - 1);
	});
	$("#issueAddReference").click(
			function() {
				if ($("#issueReferenceEdit").val() != "") {
					$("#issueReferenceList").append(
							$("<option />")
									.text($("#issueReferenceEdit").val()));
				}
				$("#issueReferenceEdit").val("");
				return false;
			});

	$("#issueRemoveReference").click(function() {
		$('#issueReferenceList option:selected').remove();
		return false;
	});
	if( $.urlParam("showIssue") && false ){
		console.log("showIssues");
		$(".pagerButton").css("display", "auto");
		$("#issueListPlaceholder").children().remove();
		var qData = {};
		qData["issueURI"] = $.urlParam("showIssue");
		$.getJSON("/api/query_issues.pl", qData, fetchIssuesComplete);	
	}

}
