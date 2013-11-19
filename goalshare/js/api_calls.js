function showInfo(message){
	console.log(message);
}


function addCollaborator(goalURI, personURI){
	$.ajax("/api/collaborator.pl", { data: {
		command: "add",
		goalURI: goalURI,
		participantURI: personURI
	}
	}).done(function(){
		showInfo(Locale.dict.Participant_AddedMessage);
	});
}