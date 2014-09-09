function getGoals(){

}


// Delete goal via API
function deleteGoal(goalURI) {
	if (goalURI && goalURI != "") {
		$.ajax("http://radish.ics.nitech.ac.jp/api/goal.pl", {
			async : false,
			data : {
				command : "clear",
				goalURI : goalURI,
				deleteConfirmation : "clearTrue"
			}
		});
	}
}



// Append collaborator avatars
function getCollaborators(goalURI) {
	$.getJSON("http://radish.ics.nitech.ac.jp/api/collaborator.pl", {
		command : "get",
		goalURI : goalURI
	}, function(data) {

		$("#goalParticipantListBody").loadTemplate(
				"templates/PersonTemplate.html", data.participants, {
					file : true
				});
	});
}


function getSubgoalDetails(goalURI) {
	$.ajax("http://radish.ics.nitech.ac.jp/api/query_subgoals.pl", {
		// async: false,
		data : {
			goalUrl : goalURI
		}
	}).done(
			function(data) {
				var subgoalData = [];
				$.each(data.subgoals, function(key, val) {
					subgoalData.push({
						goalDetailURI : val.url,
						title : val.title,
						description : val.description,
						desiredDate : formatDate(val.desiredTargetDate),
						requiredDate : formatDate(val.requiredTargetDate),
						completedDate : formatDate(val.completedDate),
						creatorURI : val.creatorUrl,
						creator : user.translateUser(val.creator),
						status : translateStatus(val.status),
						statusCode : val.status,
						parentGoal : val.parentGoal,
						creatorImageURI : val.creatorImageURI,
						creatorName : user.translateUser(val.creatorName),
						wisherName : user.translateUser(val.wisherName),
						wisherImageURI : val.wisherImageURI,
						wisherURI : val.wisherURI,
						reference: val.reference,
						imageURI : (val.wisherImageURI) ? val.wisherImageURI
								: val.creatorImageURI
					});
				});
				goalDetails.subgoals = subgoalData;
				displaySubgoals(1);

			});
}

function addGoal(parentGoalURI, goalTitle, description, desiredDate,
		requiredDate, creator, createdDate, status, reference, issueURI,
		locationURI, goalWisherURI, relatedList, oldGoalURI) {

	var localGoalURI = "http://collab.open-opinion.org/resource/Goal/" + guid();
	if( oldGoalURI ){
		localGoalURI = oldGoalURI;
	}
	var params = {
		goalURI : localGoalURI,
		parentGoalURI : parentGoalURI,
		title : goalTitle,
		description : description,
		reference : reference,
		creator : creator,
		createdDate : createdDate,
		status : status,
		locationURI : locationURI,
		goalWisherURI : goalWisherURI,
		relatedList : relatedList.join(";"),
	};
	if( oldGoalURI ){
		params.update = "updateTrue";
	}
	if (desiredDate)
		params.desiredDate = desiredDate;
	if (requiredDate)
		params.requiredDate = requiredDate;
	// If generated from an issue, create link between them.
	$.get("/api/insert_goal.pl", params);
	if (issueURI)
		$.get("http://radish.ics.nitech.ac.jp/api/issue_sollution.pl", {
			command : "add",
			goalURI : localGoalURI,
			issueURI : issueURI
		});
}

