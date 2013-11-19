
// Goal singleton for storing fetched goals and paging info
var goalDetails = {
	goals: null,
	goalsPage: 1,
	goalsPerPage: 10,
	
	goal:null,
	subgoalPage: 1,
	subgoals: null,
	subgoalsPerPage:4,
	
	resetSubgoals: function(){
		this.goal = null;
		this. subgoalPage = 1;
		this.subgoals = null;
	},
	resetGoals: function(){
		this. goalPage = 1;
		this.goals = null;
	}
};

var goalsAutocomplete;
$.getJSON("/api/autocomplete.pl", { type: "goals"},
	function(data){
	goalsAutocomplete = data.goals;
	});
// Clear the goal edit form and set default values
function resetGoalEditSelection(){
	$("#parentGoalEdit").val("");
	$("#goalTitleEdit").val("");
	$("#goalDescriptionEdit").val("");
	$("#goalRequiredDateEdit").datepicker("setDate", new Date());
	$("#goalDesiredDateEdit").datepicker("setDate", new Date());
	$("#goalCreatedDateEdit").datepicker("setDate", new Date());
	$("#goalReferenceEdit").val("");
}



// Init goal edit dialog
function goalEditInit(){
	

	$("#goalDesiredDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", ((new Date).getDate() + 30));

	$("#goalRequiredDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", ((new Date).getDate() + 30));
	
	$("#goalCreatedDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", new Date());
	/* $("#goalStatusEdit").multiselect({
		height : 110,
		minWidth : 150,
		noneSelectedText : "None",
		//selectedText : "# selected",
		checkAllText : "All",
		uncheckAllText : "None",
		multiple: false
		
	});
 */	
	resetGoalEditSelection();
}

function addGoal(parentGoalURI, goalTitle, description, desiredDate, requiredDate, creator, createdDate, status, reference){
	$.get("api/insert_goal.pl", { goalURI: "http://collab.open-opinion.org/resource/Goal/" + guid(),
								  parentGoalURI: parentGoalURI,
								  title: goalTitle,
								  description: description,
								  reference: reference,
								  desiredDate: desiredDate,
								  requiredDate: requiredDate,
								  creator: creator,
								  createdDate: createdDate,
								  status: status});
}


	
// Opens goal edit dialog. If parent goal uri is given, it is set automatically.
function openGoalEdit(parentGoalURI, referenceURI){
	
	resetGoalEditSelection();
	$("#goalEditDialogContent").dialog({
		modal: true,
		width: 'auto',
		height: 'auto',
		close: function(event, ui){
			//$("#goalEditDialogContent").show();
		 },
		 closeOnEscape: true,
		 open: function(){$("#parentGoalEdit").autocomplete({source: goalsAutocomplete });},
		 buttons: [ {
			 			text: Locale.dict.Act_Apply,
						click: function(){
				 			addGoal($("#parentGoalEdit").val(),
				 					$("#goalTitleEdit").val(),
				 					$("#goalDescriptionEdit").val(),
				 					(new Date( Date.parse($("#goalDesiredDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					(new Date( Date.parse($("#goalRequiredDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					"Creator",
				 					(new Date().format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					$("#goalStatusEdit").val(),
				 					$("#goalReferenceEdit").val()
				 			)
							resetGoalEditSelection();
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
	if(parentGoalURI){
		$("#parentGoalEdit").val(parentGoalURI);
	}
	if(referenceURI){
		$("#goalReferenceEdit").val(referenceURI);
	}
}


/*** GOAL Details ***/
function displaySubgoals(page){
	goalDetails.subgoalPage = page;
	if( goalDetails.subgoals ){
		$("#subgoalsListBody").loadTemplate("templates/subgoalTemplate.html", goalDetails.subgoals, { 
					paged: true, 
					elemPerPage: goalDetails.subgoalsPerPage, 
					pageNo: page,
					isFile: true,
					success: function(){
						localizeUI();
						if( goalDetails.subgoals.length <= goalDetails.subgoalsPerPage * goalDetails.subgoalPage ){
							$("#subgoalsPagerNext").attr('disabled', 'disabled');
						}else{
							$("#subgoalsPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#subgoalsPagerPrev").attr('disabled', 'disabled');
						else
							$("#subgoalsPagerPrev").removeAttr('disabled');
						
					},
					errorMessage: "Error"
				});
	}
}

function getCollaborators(goalURI){
	$.getJSON("/api/collaborator.pl", { command: "get", goalURI: goalURI },function(data){
		
		$("#goalParticipantListBody").loadTemplate("templates/PersonTemplate.html", data.participants, {file: true});
	});
}


function getSubgoalDetails(goalURI){
	$.ajax("/api/query_subgoals.pl",{
		//async: false,
		data: { goalUrl: goalURI }
	}).done( function(data){
		var subgoalData = [];
		$.each(data.subgoals ,function(key, val){
			subgoalData.push({
				goalDetailURI: val.url,
				title: val.title,
				description: val.description,
				desiredDate: formatDate(val.desiredTargetDate),
				requiredDate: formatDate(val.requiredTargetDate),
				completedDate: formatDate(val.completedDate),
				creatorURI: val.creatorUrl,
				creator: val.creator,
				status: translateStatus(val.status),
				statusCode: val.status,
				parentGoal: val.parentGoal
			});
		});
			goalDetails.subgoals=subgoalData;
			displaySubgoals(1);
			$(".openGoalEdit").click(function(){
				var goalUri = $( $(document).find("#" + $(this).data("currentgoalid") )[0] ).val();
				//displayGoalDetails(goalUri);
				openGoalEdit(goalUri);
			});
			$(".findSimilarGoals").click(function(){
				var goalUri = $( $(document).find("#" + $(this).data("currentgoalid") )[0] ).val();
				//displayGoalDetails(goalUri);
				openGoalEdit(goalUri);
			});
			$(".addCollaborator").click(function(){
				
				var goalUri = $( $(document).find("#" + $(this).data("currentgoalid") )[0] ).val();
				
				addCollaborator(goalUri, "http://test.com" );
				
			});
	});
}



// Displays goal details
function displayGoalDetails(goalURI){
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


/*** GOAL List ***/


function displayGoals(page){
	
	goalDetails.goalPage = page;
	if( goalDetails.goals ){
		$("#goalDataHolder").loadTemplate("templates/goalResourceTemplate.html", goalDetails.goals, { 
					paged: true, 
					elemPerPage: goalDetails.goalsPerPage, 
					pageNo: page,
					isFile: true,
					success: function(){
						localizeUI();
						if( goalDetails.goals.length <= goalDetails.goalsPerPage * goalDetails.goalPage ){
							$("#goalsPagerNext").attr('disabled', 'disabled');
						}else{
							$("#goalsPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#goalsPagerPrev").attr('disabled', 'disabled');
						else
							$("#goalsPagerPrev").removeAttr('disabled');
						
						$(".openGoalInfo").click(function(){
							var goalUri = $($(this).parent().parent().find(".goalID")[0]).val();
							displayGoalDetails(goalUri);
							//openGoalEdit($(this).data("goalUrl"));
						});
						
						
						$(".goalPath").each(function(){
							var dest = this;
							var goalURI = $( $(this).parent().find(".goalID")[0] ).val()
							$.getJSON("/api/query_goal_path.pl", { goalURI: goalURI }, function(data){
								$(dest).text(data.goalPath);
							});
						});
						$(".goalStatusCode").each(function(){
							var statusCode = $(this).val();
							$($(this).parent().children(".goalStatusIcon")[0]).addClass(statusCode);
						});
					},
					errorMessage: "Error"
				});
	}	
}
	function fetchGoalsSuccess(data) {
		// Contains goal dom elements to be appended
		goalDetails.resetGoals();
		var goals = [];
		$.each(data.goals, function(key, val){
			goals.push({
				goalURI: val.url,
				title: val.title,
				creator: val.creator,
				creatorURI: val.creatorUrl,
				status: translateStatus(val.status),
				statusCode: val.status,
				createdDate: Locale.dict.CreatedDate + ": " + formatDate(val.dateTime),
				desiredDate: Locale.dict.DesiredDate + ": " +formatDate(val.desiredTargetDate),
				requiredDate: Locale.dict.RequiredDate + ": " +formatDate(val.requiredTargetDate),
				completedDate: val.completedDate,
				subgoalsCount: val.cntSubgoals,
				goalPath: val.goalPath
			});
		});
		goalDetails.goals = goals;
		displayGoals(1);
	}
	
	/*** Filters ***/
	
	function setupGoalFilters() {
		var today = new Date();
		var prev = new Date();
		prev.setDate(today.getDate() - 60);

		$("#startDate").datepicker({
			buttonImage : "calendar.gif",
			buttonText : Locale.dict.Calendar,
			altFormat : "dd.mm.yy",
			dateFormat: Locale.dict.X_DateFormatJQ
		}).datepicker("setDate", prev);

		$("#endDate").datepicker({
			buttonImage : "calendar.gif",
			buttonText : Locale.dict.Calendar,
			altFormat : "dd.mm.yy",
			dateFormat: Locale.dict.X_DateFormatJQ
		}).datepicker("setDate", today);

		$("#goalStatus").multiselect({
			height : 110,
			minWidth : 150,
			noneSelectedText : Locale.dict.T_MultiSelect_None,
			selectedText : Locale.dict.T_MultiSelect_SelectedText,
			checkAllText : Locale.dict.T_MultiSelect_All,
			uncheckAllText : Locale.dict.T_MultiSelect_None
		});
		
		$("#createdBy").autocomplete();
		
		$.getJSON("/api/autocomplete.pl", { type: "creators" },
				function(data){
			$("#createdBy").autocomplete({source: data.Creators});
				});

		$("#goalSubmit").click(
				function() {
					// Clear old goals
					$(".pagerButton").css("display", "auto");
					$("#goalDataHolder").children().remove();					
					var qData = {};
					qData["startTime"] = (new Date( Date.parse($("#startDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
					qData["endTime"] = (new Date( Date.parse($("#endDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
					qData["dateType"] = $('input:radio[name=dateType]:checked').val();
					qData["num"] = $("#resultLimit").val();
					qData["created"] = $("#createdBy").val();
					qData["keyword"] = $("#keyword").val();
		
					if ($("#goalStatus").val())
						qData["goalStatus"] = $("#goalStatus").val().join(";");

					$.getJSON("/api/query_goals.pl", qData,
							fetchGoalsSuccess);
					//.getJSON("http://localhost/cgi-bin/query_goals.pl", qData).done(fetchGoalsSuccess);
				});
	}
	function setupGoalCommands(){
		$("#goalCreate").click(function(){
			openGoalEdit();
		});
		$("#goalsPagerNext").click(function(){
			displayGoals(goalDetails.goalPage + 1);
		});
		$("#goalsPagerPrev").click(function(){
			displayGoals(goalDetails.goalPage - 1);	
		});
		$("li.goal").click(function(){$("#goalSubmit").click();});
		
		
	}
