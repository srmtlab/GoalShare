// Goal singleton for storing fetched goals and paging info
var issueDetails = {
	issue: null,
	issuesPage: 1,
	issuesPerPage: 10,
	
	resetIssues: function(){
		this.issue = null;
		this. issuesPage = 1;
	},
	
};


function resetIssueEditSelection(){
	$("#issueTitleEdit").val("");
	$("#issueDescriptionEdit").val("");
	$("#issueCreatedDateEdit").datepicker("setDate", new Date());
	$("#issueReferenceEdit").val("");
	$("#issueReferenceEdit").val("");
	$('#issueReferenceList option').remove();
}

function addIssue(issueURI, title, description, references, createdDate, creator, creatorURI, creatorImageURI){
	//console.log("adding " + issueURI+ title+ description+ references.join(';')+ createdDate+ creator);
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
				 			addIssue("http://data.open-opinion.org/socia/data/Issue/" + guid(),//$("#issueTitleEdit").val() + Math.round((new Date()).getTime() / 1000)+"IS",
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
	goalDetails.resetSubgoals();
	$.getJSON("/api/get_goal.pl", { goalURI: goalURI },function(data){
			if(data){
				
				// Goal data loaded, display template
				$("#goalDetailBody").loadTemplate("templates/goalDetailTemplate.html", { 
						goalURI: data.results.bindings[0].goal.value,
						title: data.results.bindings[0].title.value,
						description: data.results.bindings[0].desc.value,
						status: (data.results.bindings[0].status)? translateStatus(data.results.bindings[0].status.value):"-",
						statusCode: (data.results.bindings[0].status)?data.results.bindings[0].status.value:"",
						statusImage: (data.results.bindings[0].status)? translateStatusImage(data.results.bindings[0].status.value):"",
						desiredDate: (data.results.bindings[0].desiredTargetDate)? formatDate( data.results.bindings[0].desiredTargetDate.value ):" -",
						requiredDate: (data.results.bindings[0].requiredTargetDate)? formatDate( data.results.bindings[0].requiredTargetDate.value ):" -",
						completedDate: (data.results.bindings[0].completedDate)? formatDate( data.results.bindings[0].completedDate.value ) : " -",
						parentGoalURI: (data.results.bindings[0].parentGoal)?data.results.bindings[0].parentGoal.value:"",
						creatorURI: data.results.bindings[0].creator.value,
						creatorName: data.results.bindings[0].creator.value,
						creatorImage: "image/nobody.png"
				},{ isFile: true,
					success: function(){						
						getSubgoalDetails(goalURI);
						
						getCollaborators(goalURI);
						 
					}
				});
			}
		});
	
	
}

/* Displays a page of issues */
function displayIssues(page){
	console.log(page);
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
						$(".issueToGoal").click(function(){
							// Open goal creation dialog
							var refURI = $( $(this).parent().find(".issueID")[0] ).val();
							console.log(refURI);
							openGoalEdit(null, refURI);
						});
						if( issueDetails.issues.length <= (issueDetails.issuesPerPage * issueDetails.issuesPage )){
							$("#issuesPagerNext").attr('disabled', 'disabled');
						}else{
							$("#issuesPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#issuesPagerPrev").attr('disabled', 'disabled');
						else
							$("#issuesPagerPrev").removeAttr('disabled');
						
						$(".openIssueInfo").click(function(){
							var URI = $($(this).parent().parent().find(".issueID")[0]).val();
							displayIssueDetails(URI);
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
