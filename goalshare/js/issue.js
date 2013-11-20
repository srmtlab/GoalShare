// Issue singleton for storing fetched goals and paging info
var issueDetails = {
	issue: null,
	issuesPage: 1,
	issuesPerPage: 7,
	
	resetIssues: function(){
		this.issue = null;
		this. issuesPage = 1;
	},
	
};

// Issue api handles all API calls
var issueAPI = {
		addIssue:function (issueURI, title, description, references, createdDate, creator, creatorURI, creatorImageURI){
					$.ajax("/api/insert_issue.pl", { 
							data: { issueURI: issueURI,
									title: title,
									description: description,
									references: references.join(';'),
									createdDate: createdDate,
									creator: creator,
									creatorURI: creatorURI,
									imageURI: creatorImageURI		
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

function resetIssueEditSelection(){
	$("#issueTitleEdit").val("");
	$("#issueDescriptionEdit").val("");
	$("#issueCreatedDateEdit").datepicker("setDate", new Date());
	$("#issueReferenceEdit").val("");
	$("#issueReferenceEdit").val("");
	$('#issueReferenceList option').remove();
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
			 			text: Locale.dict.Act_Apply,
						click: function(){
							var refList = [];
							$( "#issueReferenceList option").each(function(key, item){refList.push($(item).val());});
				 			issueAPI.addIssue("http://collab.open-opinion.org/resource/Issue/" + guid(),//$("#issueTitleEdit").val() + Math.round((new Date()).getTime() / 1000)+"IS",
				 					$("#issueTitleEdit").val(),
				 					$("#issueDescriptionEdit").val(),
				 					refList,
				 					(new Date( Date.parse($("#issueCreatedDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					user.name,
				 					user.URI,
				 					user.imageURI
				 					//"Creator"
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
}

//Displays goal details
function displayIssueDetails(issueURI){
	//issueDetails.resetRelatedGoals();
	//http://localhost/api/get_issue.pl?issueURI=http://collab.open-opinion.org/resource/Issue/f574c263-ee83-1f2a-7009-a942b6080a17
	var localIssueURI = issueURI; 
	$.getJSON("/api/get_issue.pl", { issueURI: issueURI },function(data){
			if(data){
				//console.log(issueURI);
				
				// Goal data loaded, display template
				$("#issueDetailBody").loadTemplate("templates/issueDetailTemplate.html", { 
						issueURI: data.issueURI,
						title: data.title,
						description: data.description,
						createdDate: (data.createdDate)? formatDate( data.createdDate ) : " -",
						creatorURI: data.creatorURI,
						creatorName: "Creator",
						creatorImage: "image/nobody.png"
				},{ isFile: true,
					success: function(){						
						$.ajax("/api/issue_sollution.pl", { 
							data: { command: "get", 
									issueURI: localIssueURI}
							}).done(function(data){
								$("#issueSollutionDataholder").children().remove();
								
								$("#issueSollutionDataholder").append(
											$("<a />").attr("href", data.goalURI)
														.append($("<span />").text(data.title))
										);
							});
						
						$.ajax("/api/issue_sollution.pl", { 
							data: { command: "get", 
									issueURI: localIssueURI}
							}).done(function(data){
								$("#issueSollutionDataholder").children().remove();
								if(data.sollutions){	
									$("#issueSollutionDataholder").append(
											$("<a />").attr("href", data.sollutions[0].goalURI)
														.append($("<span />").text(data.sollutions[0].title))
										);
								}
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
						
						$(".issueToGoal").click(function(){
							// Open goal creation dialog
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
				creatorImageURI: "image/nobody.png",
				createdDate: Locale.dict.CreatedDate + ": " + formatDate(val.dateSubmitted),
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

	$.getJSON("/api/autocomplete.pl", { type: "creators", data: "issue" },
			function(data){
				$("#issueCreatedBy").autocomplete({source: data.Creators});
			});
	$("#issueFilterSubmit").click(
			function() {
				// issueListWrapper
				$(".pagerButton").css("display", "auto");
				$("#issueListWrapper").children().remove();					
				var qData = {};
				qData["startTime"] = (new Date( Date.parse($("#issueStartDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
				qData["endTime"] = (new Date( Date.parse($("#issueEndDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
				qData["num"] = $("#issueResultLimit").val();
				qData["created"] = $("#issueCreatedBy").val();
				qData["keyword"] = $("#issueKeyword").val();
				$.getJSON("/api/query_issues.pl", qData, fetchIssuesComplete);
			});
}


function setupIssueCommands(){
		$("#issueCreate").click(function(){
			openIssueEdit();
		});
		$("#issuesPagerNext").click(function(){
			displayIssues(issueDetails.issuesPage + 1);
		});
		$("#issuesPagerPrev").click(function(){
			displayIssues(issueDetails.issuesPage - 1);	
		});		
		$("li.issue").click(function(){$("#issueFilterSubmit").click();});
}
