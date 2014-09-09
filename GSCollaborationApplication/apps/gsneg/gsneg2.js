/**
 * The high level application
 */
var lc = 0;
var text="";
var text2="";
var gsneg = {
	debug: true,
	// Is the application initiated
	state: {
		inited: false
	},
	// Returns hangout's id
	id: function(){
		return gapi.hangout.getHangoutId();
	},
	lineHiders: {
		
	},
	// Mini-map stuff
	map: {
		outerRect: null,
		innerRect: null,
		initDone: false,
		tempItems: [],
		conf: {
			w: 200,
			h: 200,
			padding: 200,
		}
	},
	// Visual configuration
	conf:{
		noteWidth: 120,
		noteHeight: 130,
		connectionsType_parentChild: "parent-child",
		connectionsType_conflict: "conflict",
		treePadding: 150,
		treeDefaultPosition: {x:300, y:300}
	},	
	linePopups: {},
	// General variables
	vars: {
		HOST: "https://radish.ics.nitech.ac.jp/gsneg",
		table: null,
		state_: null,
		metadata_: null,
		participants_:null
	},
	init: function(){
	},
	// deprecated
	render: function(){
		
	},
	// Local copy of common state
	notes: [],
	deletedNotes: [],
	mergedNotes:[],
	permanentLayer: null,
	savedStates: [],	
	gsData:{
		goalsAutoComplete: null	
	},
	
	literals:{
		DEFAULT_TITLE : "Note",
		DEFAULT_DESC: "Description.",	
	},
	
	// Functionality
	connectDragSource: null,
	connectDragType: null,
	noteDrag: null,
	// Get data to calculate coordinates.
	getLocationData: function(){
		var t = $("#container").offset();
		var data = {
			canH: gsneg.stage.getHeight(),
			canW: gsneg.stage.getWidth(),
			canOffTop: t.top,
			canOffLeft: t.left,
			winH: window.innerHeight,
			winW: window.innerWidth,
			mw:200,
			mh:200,
			margin:10
		};
		var mapTopLeftX = ((data.winW - data.margin) - data.mw) + data.canOffLeft*-1;
		var mapTopLeftY = ((data.winH - data.margin) - data.mh) + data.canOffTop*-1
		// Calculated result
		var retval = {
			canvasOffsetTop: t.top,
			canvasOffsetLeft: t.left,
			canvasScrollTop: $("#mainTable").scrollTop(),
			canvasScrollLeft: $("#mainTable").scrollLeft(),
			canvasHeight: gsneg.stage.getHeight(),
			canvasWidth: gsneg.stage.getWidth(),
			
			mapTopLeftX: mapTopLeftX,
			mapTopLeftY: mapTopLeftY,
			// Calculate the viewport size in the map
			viewportWidth:data.mw * (data.winW / data.canW),
			viewportHeight:data.mh * (data.winH / data.canH),
			// Calculate the position of viewport
			viewportX: data.mw * ((data.canOffLeft*-1) / data.canW) + mapTopLeftX,
			viewPortY: data.mh * ((data.canOffTop*-1) / data.canH) + mapTopLeftY,
		}
		return retval;
	},
	// Creating a new note with parameters
	createNewNote: function(paramsP){
		var params = paramsP;
		if ( !params )
			params = {};
		var uid = guid();
		if ( !params.id )
			params.id = uid;
		if ( !params.gsId )
			params.gsId = "";
		if ( !params.title )
			params.title = gsneg.literals.DEFAULT_TITLE;
		if ( !params.desc )
			params.desc = gsneg.literals.DEFAULT_DESC;
		if ( !params.parents )
			params.parents = [];
		if ( !params.noteData)
			params.noteData = {};
		// The note element and functionality
		var note = $("<div />")
			.addClass("note new")
			.attr("id", params.id)
			.data("noteId", params.id)
			.data("gsId", params.gsId)
			.data("type", "note")
			.data("title", params.title)
			.data("desc", params.desc)
			.data("data", params.noteData)
			.draggable({
				start:function(event, ui){
					gsneg.noteDrag = params.id;
				},
				drag: function(event, ui){
					// Send notification to others only if enough time has lapsed since last message
					if ( !arguments.callee.lastCall || Date.now() - arguments.callee.lastCall > 45) {
						var test = $(note).offset();
						notifyMove(params.id, test.top, test.left);
						arguments.callee.lastCall = Date.now();
					}
					return true;
				},
				stop: function(event, ui){
					gsneg.noteDrag = null;
					notifyMoveEnd(params.id, ui.position.top, ui.position.left);	
				}
			})
			.droppable({
				drop: function(event, ui){
					if( gsneg.connectDragSource){
						saveParent(gsneg.connectDragSource, params.id);
						saveConnection(gsneg.connectDragSource, params.id, gsneg.connectDragType);
						gsneg.connectDragSource = null;
						gsneg.connectDragType = null;
					}
				}
			})
			.css("position", "absolute");
		// Position
		if (! params.left ) {
			var loc = gsneg.getLocationData();
			var pos = ({ top: Math.round( loc.canvasScrollTop + (loc.viewportHeight/2) ), left: Math.round(loc.canvasScrollLeft + (loc.viewportWidth/2) ) });
			params.top = pos.top;
			params.left = pos.left;
		}
		if ( params.left )
			note.offset( { top: params.top, left: params.left } );
		// Title element
		var title = $("<h3 />").addClass("title")
				.addClass("giveMeEllipsisTwo")
				.text(params.title)
				.attr("title", params.title)
				.editable(function(value){
					notifyChange(params.id, value, null);
					$(this).attr("title", params.title);
					return value;
				},{event: "dblclick"});
		
		var desc = $("<text />").addClass("desc")
			.addClass("giveMeEllipsisTwo")
			.text(params.desc)
			.attr("title", params.desc)
			.editable(function(value){
				//console.log(this);
				notifyChange(params.id, null, value);
				//$(this).text(value);
				$(this).attr("title", value);
				return value;
			},{event: "dblclick"});
		// Delete note button
		var delBtn = $("<div />")
				.data("id", params.id)
				.data("gsId", params.gsId)
				.addClass("deleteButton")
				.click(function(){
						if (params.gsId) {
							gsneg.deletedNotes.push(params.gsId);
							gsApi.sessionApi.setValue( gsneg.id(), "deletedNotes", {deletedNotes: JSON.stringify(gsneg.deletedNotes) });
						}
						gsneg.deleteNote(params.id);
					});
		
		// Command area
		var commandArea = $("<div />").addClass("areaFooter");
		
		// Buttons to connect notes
		var connectButton = $("<div />").addClass("connectButton")
			.addClass("disableDrag")
			.data("id", "connnect_"+params.id)
			.data("type", "connect")
			.data("connectType", "parent-child")
			.addClass("connectButton")
			//.addClass("button")
			.addClass("parent")
			.draggable({
				start: function(){
					// Save id of source
					gsneg.connectDragSource = $(this).closest(".note").attr("id");
					gsneg.connectDragType = "parent-child";
				},
				revert: function(evt){
					// Return after drag
					if (evt === false) {
						var pos = gsneg.stage.getPointerPosition();
						console.log(pos)
						if ( !pos ){
							return true;
						}
						var uid = guid();
						var note = gsneg.createNewNote({id: uid, top: pos.y, left: pos.x});
						saveNote(uid, pos.y, pos.x, gsneg.literals.DEFAULT_TITLE, gsneg.literals.DEFAULT_DESC, [params.id]);
						console.log("connection {0}->{1}".format(params.id, uid));
						saveConnection(params.id, uid, gsneg.connectDragType);
						return true;
					}
					return true;
				},
				stop: function(){
					gsneg.connectDragSource = null;
					gsneg.connectDragType = null;
				}
			}); 
		commandArea.append(connectButton);
		// Button to drag for conflicting goals
		var conflictButton = $("<div />").addClass("connectButton")
		.data("id", "conflict_"+params.id)
		.data("type", "connect")
		.data("connectType", "conflict")
		.addClass("connectButton")
		.addClass("conflict")
		//.addClass("button")
		.draggable({
			start: function(){
				// Save id of source
				gsneg.connectDragSource = $(this).closest(".note").attr("id");
				gsneg.connectDragType = "conflict";
			},
			revert: function(){
				return true;
			},
			stop: function(){
				gsneg.connectDragSource = null;
				gsneg.connectDragType = null;
			}
		}); 
		commandArea.append(conflictButton);
		
		$(note).append(delBtn);
		$(note).append(title);
		$(note).append(desc);
		$(note).append(commandArea);
		console.log(note);
		$("#noteArea").prepend(note);
		return note;
	},

	deleteNote: function(id){
		$("#" + id).remove();
		
		
		gsneg.notes = $.grep(gsneg.notes, function(o, i){ return o.id != id;});
		gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( gsneg.notes ) )
		gsneg.deleteConnections(id);
	},
	mergeNotes: function(id1, id2){
		// Merge all to note 1
		//console.log( "Merging {0} and {1}".format(id1, id2) );
		// Remove note2
		gsneg.notes = $.grep(gsneg.notes, function(o, i){ return o.id == id2;}, true);
		//console.log(notes);

		// Translate 

		// remove self links
		gsneg.connections = $.grep(gsneg.connections, function(o,i){ return (o.id1 == id1 && o.id2 == id2)
				||  (o.id1 == id2 && o.id2 == id1);}, true);
		// Translate rest 
		gsneg.connections = $.each(gsneg.connections, function(i, o){
			
			if( o.id1 == id2 )
				this.id1 = id1;
			if( o.id2 == id2 )
				this.id2 = id1;
			this.kayty = "Joo";
		});
		gsneg.mergedNotes.push({id1: id1, id2:id2});
		saveNoteState();
		$("#" + id2).remove();
	},
	deleteConnections: function(id){
		var connections = gsneg.connections;
		connections = $.grep(connections, function(o, i){ return o.id1 != id && o.id2 != id;});
		gsneg.connections = connections;
		saveNoteState();
	},
	deleteConnection: function(id1, id2, type){
		var connections = gsneg.connections;
		connections = $.grep(connections, function(o, i){ return o.id1 == id1 && o.id2 == id2 && (!type || o.type == type);}, true);
		gsneg.connections = connections;
		saveNoteState();
	},
	applyChanges: function(params){
		var note = $("#" + params.id);
		// title
		if ( params.title ){
			note.data("title", params.title);
			var title = note.find(".title")[0];
			$(title).text(params.title);
		}
		if ( params.desc ){
		note.data("desc", params.desc);
			var desc = note.find(".desc")[0];
			$(desc).text(params.desc);
		}
	},
	setState: function(id){
		// Set conversation state
		$(".state").removeClass("selected");
		$($(".state")[id]).addClass("selected");
	},
	setTopic: function(value){
		$("#topic").text(value);
	},
	setDescription: function(value){
		$("#description").text(value);
	},
	saveTree: function(name){
		// clear state 
		var saveState = {
				name: name,
				notes: JSON.parse( JSON.stringify( gsneg.notes ) ),
				connections: JSON.parse( JSON.stringify( gsneg.connections ) )
		}
		
		gsneg.savedStates.push(saveState);	
		// Save
		gsApi.sessionApi.setValue(gsneg.id(), "savedStates", JSON.stringify(gsneg.savedStates) )
	},
	saveTreeToGS: function(update){
		// Save current tree to goalshare
		var notes = JSON.parse( JSON.stringify(gsneg.notes) );
		var connections = JSON.parse( JSON.stringify(gsneg.connections));
		var deleted = JSON.parse( JSON.stringify(gsneg.deletedNotes));
		var merged = JSON.parse( JSON.stringify(gsneg.mergedNotes));
		
		// Save notes
		$.each(notes, function(o, i){
			params = {
				id: this.id,
				title: this.title,
				desc: this.desc,
			};
			if (update && !params.gsId) 
				params.gsId = this.gsId;
			
			if ( !update ) {	
				params.gsId = gsApi.goalApi.getResourceUrl( guid() );
				
			}
			gsApi.goalApi.addGoal(params);
			
			if ( !this.gsId ){
				this.gsId = gsApi.goalApi.getResourceUrl(this.id);
			}
		});
		// Poor sleep for debugging server, virtuoso had unexpected problems
		for (var u = 0; u < 100000000;u++) {
					for (var p = 0; p < 20; p++) {
						;
					}
					
				}
		// Save connections
		$.each(connections, function(i, o){
			if (this.type == gsneg.conf.connectionsType_parentChild) {
				var id1 = this.gsId1 && update ? this.gsId1 : gsApi.goalApi.getResourceUrl(this.id1);
				var id2 = this.gsId2  && update ? this.gsId2 : gsApi.goalApi.getResourceUrl(this.id2);
				
				log("Linking goals {0} {1}".format(id1, id2));
				// Delay for server
				for (var u = 0; u < 100000000;u++) {
					for (var p = 0; p < 2; p++) {
						;
					}
					
				}
				gsApi.goalApi.linkGoal(id1, id2);
				if ( !this.gsId1 ) {
					this.gsId1 = gsApi.goalApi.getResourceUrl(this.id1);
				}
				if ( !this.gsId2 ) {
					this.gsId2 = gsApi.goalApi.getResourceUrl(this.id2);
				}
			}
		});
		if ( update ) {
		// Delete "deleted" notes
		for (var i = 0; i < deleted.length; i++) {
				console.log(deleted[i]);
				gsApi.goalApi.deleteGoal(deleted[i]);
			}
		}
		
		var allUsers = gapi.hangout.getEnabledParticipants();
		var gsUsers = gsApi.userApi.getUsers().users;
		var mod = false;
		
		// Ensure that G+ user's are created to GoalShare
		for (var i = 0; i < allUsers.length; i++) {
			var id = allUsers[i].person.id 
			var users = $.grep(gsUsers, function(o,i){
				return o.fbURI == gsApi.userApi.getGPURI( id );
				});
			if (users.length == 0 ) {
				var userURI = 'http://collab.open-opinion.org/resource/Person/' + guid();
				gsApi.userApi.addUser(userURI, allUsers[i].person.displayName, allUsers[i].person.image.url, gsApi.userApi.getGPURI( allUsers[i].person.id ));
				mod = true;
			}
		}

		// Users again with ids
		if (mod) {
			// Wait for server to process
			for (var u = 0; u < 100000000;u++) {
				for (var p = 0; p < 2; p++) {
					;
				}
				
			}
			
		}
		$.each(notes, function(i,o){
			$.each(allUsers, function(ii,oo){
				gsApi.userApi.addWisherFB(o.gsId, gsApi.userApi.getGPURI(oo.person.id), log);
				});
			});
		
		
		
		gsApi.sessionApi.submitDelta(gsneg.id(), {notes:JSON.stringify(notes),connections: JSON.stringify(connections), deletedNotes: "[]"});
		
	},
	LoadTree: function(name){
		// Quickload
		var states = gsneg.savedStates;
		console.log("Loading state " + name);
		var state = null;
		for ( var i = 0; i < states.length; i++ ){
			if( name == states[i].name ){
				state = states[i];
				console.log("State found!");
				break;
			}
		}
		if ( state ){
			//resetState();
			// Clear old state
			clearTable();
			setState(state);
		}
	},
	loadGSTree: function(data, position){
		// Load tree from GoalShare
		if ( !position ) {
			position = {x:1,y:1};
		}
		
		
		var translation = {};
		for (var i = 0; i < data.goals.length; i++) {
			var obj = {gsId: data.goals[i].url, top: data.goals[i].yOffset + position.y, left: data.goals[i].xOffset + position.x, title: data.goals[i].title, desc: data.goals[i].desc, data: data.goals[i] };
			console.log(obj);
			var note = gsneg.createNewNote(obj);
			translation[data.goals[i].url] = $(note).attr("id");
			gsneg.notes.push(obj);	
		}
		for (var j = 0; j < data.connections.length; j++) {
			//log(data.connections[j])
			gsneg.connections.push({  id1: translation[data.connections[j].parent],
					       gsId1: data.connections[j].parent,
			id2: translation[data.connections[j].child],
			gsId2: data.connections[j].child,
			type: gsneg.conf.connectionsType_parentChild
			});
		}
		var saveData = { connections: JSON.stringify(gsneg.connections), notes: JSON.stringify(gsneg.notes) };
		log(saveData);
		//gapi.hangout.data.submitDelta( saveData );
		gsApi.sessionApi.submitDelta(gsneg.id(), saveData );
		
	},
	LoadTreeCompare: function(name){
		var states = gsneg.savedStates; //JSON.parse( gapi.hangout.data.getValue("savedStates") );
		//console.log("Loading state " + name);
		var state = null;
		for ( var i = 0; i < states.length; i++ ){
			if( name == states[i].name ){
				state = states[i];
				console.log("State found!");
				break;
			}
		}
		if ( state ){
			console.log("State found.");
			console.log(state);
			// Find a place to put new notes
			var maxOffsetX = 0;
			var maxOffsetY = 0;
			// Naive algorithm for easy first imlementation
			// Find rightmost note
			$.each(gsneg.notes, function(i,o){
					if ( o.left > maxOffsetX )
						maxOffsetX = o.left;
					if ( o.top > maxOffsetY )
						maxOffsetY = o.top;
				});
			
			$.each(state.notes, function(i,o){
				var _id = this.id;
				var _idNew = guid();
				console.log("Checking id {0}".format(_id));
				if ( $.grep(gsneg.notes, function(oo,ii){ return o.id == _id; }).length > 0 ) {
					// Assign new id if exists
					this.id = _idNew;
					console.log("Same id found {0}->{1}".format(_id, this.id));
					// Translate connections
					$.each(state.connections, function(i, o){	
						if( o.id1 == _id )
							this.id1 = _idNew;
						if( o.id2 == _id )
							this.id2 = _idNew;
					});
				}
				gsneg.createNewNote({id: o.id, top: o.top, left: o.left + maxOffsetX, title: o.title, desc: o.desc, parents: o.parents});
				
				gsneg.notes.push({  id: o.id, 
						top: o.top,
						left: o.left + maxOffsetX,
						title: o.title,
						desc: o.desc,
						data: {},
						parents: o.parents});
				
			});
			
			$.each(state.connections, function(i,_o){gsneg.connections.push(_o);});
			gsApi.sessionApi.submitDelta(gsneg.id(),{notes: JSON.stringify( gsneg.notes ),connections: JSON.stringify( gsneg.connections )});
			
			console.log("Done");
			//setState(state);
		}
	},
	getSavedStates: function(){
		var names = new Array();
		for ( var i = 0; i < gsneg.savedStates.length; i++ ){
			names.push(gsneg.savedStates[i].name);
		}
		return names;
	}
};

function setState(state){
	console.log("Deleting old nodes");
	// Clear old
	$(".note").remove();
	// Set state object and then load state
	
	gsneg.notes = state.notes;
	gsneg.connections = state.connections;
	for ( var i = 0; i < gsneg.notes.length; i++ ){
				console.log("Adding notes "+i)
				gsneg.createNewNote({ id:gsneg.notes[i].id, gsId:gsneg.notes[i].gsId, top: gsneg.notes[i].top, left: gsneg.notes[i].left, title: gsneg.notes[i].title, desc: gsneg.notes[i].desc, parents: gsneg.notes[i].parents });
			}
	gsApi.sessionApi.submitDelta(gsneg.id(),{ connections: JSON.stringify(state.connections), notes: JSON.stringify(state.notes) });
	
}

var requestAnimationFrame= window.requestAnimationFrame || 
window.mozRequestAnimationFrame || 
window.webkitRequestAnimationFrame || 
window.msRequestAnimationFrame;
//

function saveParent(parent, child){

	return false;
	// deprecated
}

// Wrapper to replace google's function with own server session state
function updateLocalStateWrapper(data){
	console.log(data);
	var state = data;
	try {
		state = JSON.parse(data);
	} catch(e) {
	}
	updateLocalState(state);
}


function updateLocalState(stateChangeEvent, metadata){	
	var meta = gapi.hangout.data.getStateMetadata();
	var self = gapi.hangout.getLocalParticipantId();
	 try{
		if ( stateChangeEvent.notes != JSON.stringify(gsneg.notes)){
			gsneg.notes = JSON.parse(stateChangeEvent.notes);
			$(".note").remove();
			for ( var i = 0; i < gsneg.notes.length; i++ ){
				console.log("Adding notes "+i)
				gsneg.createNewNote({ id:gsneg.notes[i].id, gsId:gsneg.notes[i].gsId, top: gsneg.notes[i].top, left: gsneg.notes[i].left, title: gsneg.notes[i].title, desc: gsneg.notes[i].desc, parents: gsneg.notes[i].parents });
			}
		}
		gsneg.connections = JSON.parse(stateChangeEvent.connections);
		gsneg.savedStates = JSON.parse(stateChangeEvent.savedStates);
		gsneg.deletedNotes = JSON.parse(stateChangeEvent.deletedNotes);
		gsneg.mergedNotes = JSON.parse(stateChangeEvent.mergedNotes);
		
		$("#topic").text(stateChangeEvent.topic);
		console.log("topic " + stateChangeEvent.topic);
		$("#description").text(stateChangeEvent.desc);
		console.log("desc " + stateChangeEvent.desc);
		// State
		$(".state").removeClass("selected");
		$($(".state")[parseInt(stateChangeEvent.state)]).addClass("selected");
		
	}catch(e){
		
	}
}

function participantsChanged(participants){
}


function saveNote(id, top, left, title, desc, parents){
	var notes = JSON.parse( gapi.hangout.data.getValue("notes") );
	notes.push({  id: id, 
			top: top,
			left: left,
			title: title,
			desc: desc,
			parents: parents});
	gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( notes ) );
}
function notifyCreate(id, top, left){
}
function notifyMove(id, top, left){
	log("MoveTo {0}[{1},{2}]".format(id, top, left));
	gsApi.sessionApi.sendMessage(gsneg.id(), '{ "command": "move", "id": "' + id + '", "top": "'+ top +'", "left": "'+ left +'"}');
}
function notifyMoveBegin(id){
	gsApi.sessionApi.sendMessage(gsneg.id(), '{ "command": "moveBegin", "id": "' + id + '"}');
}
function notifyMoveEnd(id, top, left){
	log("MoveEnd {0}[{1},{2}]".format(id, top, left));
	gsApi.sessionApi.sendMessage(gsneg.id(), '{ "command": "moveEnd", "id": "' + id + '"}' );
	// Save to state 
	var notes = gsneg.notes;
	for ( var i = 0; i < notes.length; i++ ){
		if( notes[i].id == id ){
			notes[i].top = top;
			notes[i].left = left;
			break;
		}
	}
	gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( notes ) );
}
function notifyState(id){
	//gapi.hangout.data.setValue("state", id.toString());
	gsApi.sessionApi.setValue(gsneg.id(), "state", id.toString());
	//gapi.hangout.data.sendMessage( '{ "command": "state", "id": "' + id + '"}' )
}
function saveConnection(id1, id2, type){
	//console.log(gapi.hangout.data.getValue("connections") );
	var connections = gsneg.connections;//JSON.parse( gapi.hangout.data.getValue("connections") );
	connections.push({  id1: id1,
			id2: id2,
			type: type
			});
	gsneg.connections = connections;
	//gapi.hangout.data.setValue("connections", JSON.stringify( connections ) );
	gsApi.sessionApi.setValue(gsneg.id(), "connections", JSON.stringify( connections ) );	
}

function notifyChange(id, title, desc){
	// Save state
	var notes = gsneg.notes;
	for ( var i = 0; i < notes.length; i++ ){
		if( notes[i].id == id ){
			if (title)
				notes[i].title = title;
			if(desc)
				notes[i].desc = desc;
			break;
		}
	}
	
	// Notify others
	var data = {
			command: "change",
			id: id
	};
	
	if ( title )
		data.title = title;
	if ( desc )
		data.desc = desc;
	
	gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( notes ) );
	gsApi.sessionApi.sendMessage(gsneg.id(), JSON.stringify( data ) );
}
function notifyTopic(text){
	$("#topic").text(text);
	gsApi.sessionApi.setValue(gsneg.id(),"topic", text);
}
function notifyDescription(text){
	$("#description").text(text);
	gsApi.sessionApi.setValue(gsneg.id(),"desc", text);
}
function initParticipants(){
}
function moveNote(id, top, left){
	log("MoveNote {0}[{1},{2}]".format(id, top, left));
	$("#" + id).offset( { top: top, left: left } )
}


function onMessageReceivedWrapper(event){
	onMessageReceived({message:event});
}
function onMessageReceived(event) {
	  try {
	    var data = JSON.parse(event.message);
	    if( data.command == "move" ){
	    	moveNote(data.id, data.top, data.left);
	    }
	    if( data.command == "create" ){
	    	gsneg.createNewNote({ id: data.id, top: data.top, left: data.left });
	    }
    	if( data.command == "change" ){
	    	gsneg.applyChanges({ id: data.id, title: data.title, desc: data.desc });
	    }
	    if( data.command == "state" ){
		   gsneg.setState(data.id);
		}
	    
	  } catch (e) {
	    console.log(e);
	  }
}
// Loads state 
function loadState(){
	/// Old
	return ;
	
	var state = gsApi.sessionApi.getState(gsneg.id());
	gsneg.notes = JSON.parse(state.notes);
	gsneg.savedStates = JSON.parse(state.savedStates);
	
	console.log(gsneg.notes);
	for ( var i = 0; i < gsneg.notes.length; i++ ){
		gsneg.createNewNote({ id:gsneg.notes[i].id, top: gsneg.notes[i].top, left: gsneg.notes[i].left, title: gsneg.notes[i].title, desc: gsneg.notes[i].desc, parents: gsneg.notes[i].parents });
	}
	gsneg.connections = JSON.parse(state.connections);
	// Load topic, desc, state
	try{
		var state = parseInt( state.state );
		gsneg.state = state;
		gsneg.setState(state);
	}catch(e){}
	gsneg.setTopic( state.topic );
	gsneg.setDescription( state.desc );
	
}

function initState(){
	resetState(true);
}
function resetState(init){
	var delta = { notes: "[]",
		connections: "[]",
		state: "0",
		topic: gsneg.literals.DEFAULT_TITLE,
		desc: gsneg.literals.DEFAULT_DESC,
		savedStates: "[]",
		deletedNotes: "[]",
		mergedNotes: "[]",
		lTree: "",
		rTree: ""
	}
	if ( init ) {
		delta.setup = "true";
		delta.savedStates = "[]";
	}
	$(".note").remove();
	gsApi.sessionApi.setState(gsneg.id(), JSON.stringify( delta ) );
	gsneg.notes= [];
	gsneg.mergedNotes = [];
	gsneg.deletedNotes = [];
	gsneg.connections = [];
}
function drawConnection(id1, id2, type){
	var element;
	try{
		var ele1 = $("#" + id2);
		var ele2 = $("#" + id1);
		if ( !ele1 || !ele2 ) 
			return;
		var t = $("#container").offset();
		x1 = ele1.offset().left + (ele1.width()/2) + t.left * -1;
		y1 = ele1.offset().top + (ele1.height()/2) + t.top  * -1;
		
		
		x2 = ele2.offset().left + (ele2.width()/2)  + t.left * -1;
		y2 = ele2.offset().top + (ele2.height()/2)  + t.top * -1;
		var color = 'blue';
		
		if(type == "parent-child")
			color = "black";
		if ( type == "conflict" )
			color = "red";
		
		element = drawLine( { x: x1, y: y1 }, { x: x2, y: y2 }, color );
		gsneg.map.tempItems.push(element);
		var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
		angle += 180;
		text2 += "{{4}->{5} Line[{0},{1} - {2},{3} | {6}] ".format(x1,y1,x2,y2, id1, id2, angle);
		
		// Parent indicator
		if ( type == "parent-child") {
			var inter = Intersection.intersectLineRectangle(new Point2D(x1,y1), 
					new Point2D(x2,y2),
					new Point2D(ele1.offset().left + t.left * -1, ele1.offset().top + t.top * -1),
					new Point2D(ele1.offset().left + t.left * -1 + ele1.width(), ele1.offset().top + t.top * -1 + ele1.height()));
			if ( lc % 100 === 0) {
			}
			lc+=1;
			if( inter.intersection == "Intersection" || true){
				var parCircle = new Kinetic.Circle({
					x: inter.points[inter.points.length-1].x,
					y: inter.points[inter.points.length-1].y,
					radius: 10,
					fill: color,
				      });
				var wedge = new Kinetic.Wedge({
					x: inter.points[inter.points.length-1].x,
					y: inter.points[inter.points.length-1].y,
					radius: 15,
					angle: 70,
					fill: color,
					stroke: color,
					strokeWidth: 4,
					rotation: angle-35+180
				      });
				gsneg.layer.add(wedge);
				gsneg.map.tempItems.push(wedge);
			}		
		}
		
	}catch(e){
	}
	element.gsCenter = {
		x: (x1 + x2)/2,
		y: (y1 + y2)/2
	};
	return element;
}

function drawLine(p1, p2, color){
	var line = new Kinetic.Line({
        points: [p1.x, p1.y, p2.x,p2.y],
        stroke: color,
        strokeWidth: 5,
        lineCap: 'round',
        lineJoin: 'round'
      });
	gsneg.layer.add(line);
	return line;
}

function writeMessage(canvas, message) {
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '18pt Calibri';
        context.fillStyle = 'black';
        context.fillText(message, 10, 25);
      }
function render(){
	var dsOs = $("#container").offset();
	gsneg.canvas.width = gsneg.canvas.width;
	gsneg.layer.removeChildren();
	if (gsneg.debug) {

	}
	text2 = "--";
	
	gsneg.map.tempItems = [];
	if ( !gsneg.connections ) {
		gsneg.connections = [];
	}
	for( var i = 0; i < gsneg.connections.length; i++){
		(function(element){
			try{
			var line = drawConnection(element.id1, element.id2, element.type);
			line.on("mouseover", function(e){
				console.log("Mouse");
				var pos = this.gsCenter;
				console.log(pos);
				var popup = null;
				// Show persistent popup
				var lineId = element.id1 + element.id2 + element.type;
				if (gsneg.lineHiders[lineId]) {
					clearTimeout(gsneg.lineHiders[lineId]);
				}
				else
				{
					var btn = {};
					btn[locale.currentDictionary.Delete] = function(){
						gsneg.deleteConnection(element.id1, element.id2, element.type);
						$( this ).dialog( "close" );
						};
					btn[locale.currentDictionary.Merge]= function(){
						$( this ).dialog( "close" );
						gsneg.mergeNotes(element.id1, element.id2);
						
					};					
					popup = $("<div title=\"Action\" class=\"button lineButton\"></div>")
					.hide()
					.click(function(){
						$("#lineDialog").dialog({
							autoOpen: true,
							//height: 300,
							//width: 350,
							modal: true,
							title: locale.currentDictionary.Action,
							buttons: btn
						});
					}).css({'top':pos.y,'left':pos.x, 'position':'absolute'});
					gsneg.linePopups[lineId] = popup;
					$("#mainTable").append(popup);
					popup.show();
				}
				gsneg.lineHiders[lineId] = setTimeout(function(){
						console.log("remove");
						console.log(lineId);
						$(gsneg.linePopups[lineId]).hide("slow").remove();
						gsneg.lineHiders[lineId] = null;
					}, 4000);
				
			});
			
			var btn ={};
			btn[locale.currentDictionary.Delete] = function(){
					gsneg.deleteConnection(element.id1, element.id2, element.type);
				};
			btn[locale.currentDictionary.Merge] = function(){
					gsneg.deleteConnection(element.id1, element.id2, null);
					gsneg.mergedNotes(element.id1, element.id2);
				};
			btn[locale.currentDictionary.Cancel] =  function() {
						$( this ).dialog( "close" );
					};
			line.on("click", function(){
				console.log("Line click");
				$("#lineDialog").dialog({
					autoOpen: true,
					//height: 300,
					//width: 350,
					modal: true,
					title: locale.currentDictionary.Action,
					buttons: btn
				});
				
			});
			}catch(e)
			{
				
			}
		})(gsneg.connections[i]);
	}
	drawMap();
	gsneg.stage.draw();
	requestAnimationFrame(render);
}
function drawMap(){
	if ( !gsneg.map.initDone ) {
		initMap();
	}else{
		gsneg.layer.add(gsneg.map.outerRect);
		gsneg.layer.add(gsneg.map.innerRect);
	}
	var t = $("#container").offset();
	// Small navi
	var data = {
		canH: gsneg.stage.getHeight(),
		canW: gsneg.stage.getWidth(),
		canOffTop: t.top,// 60 - -max scroll
		canOffLeft: t.left,
		winH: window.innerHeight,
		winW: window.innerWidth,
		mw:200,
		mh:200,
		margin:10
	}
	
	// Calculate position of the map
	var mapTopLeftX = ((data.winW - data.margin) - data.mw) + data.canOffLeft*-1; 
	var mapTopLeftY = ((data.winH - data.margin) - data.mh) + data.canOffTop*-1;
	// Calculate the viewport size in the map
	var wpW = data.mw * (data.winW / data.canW);
	var wpH = data.mh * (data.winH / data.canH);
	// Calculate the position of viewport
	var leftOffMap = data.mw * ((data.canOffLeft*-1) / data.canW) + mapTopLeftX;
	var topOffMap  = data.mh * ((Math.min(data.canOffTop,0)*-1) / data.canH) + mapTopLeftY;
	
	gsneg.map.outerRect.setPosition({x:mapTopLeftX, y:mapTopLeftY});
	if ( !gsneg.map.innerRect.isDragging() ) 
		gsneg.map.innerRect.setPosition({x:leftOffMap, y:topOffMap});
	gsneg.map.innerRect.size({width:wpW, height: wpH});
	var notes = gsneg.notes;
	
	$.each(notes, function(i, o){
		//console.log(o);
		var x = data.mw * (o.left / data.canW) + mapTopLeftX;
		var y = data.mh * (o.top / data.canH) + mapTopLeftY;
		var noteR = new Kinetic.Rect({
			x: x,
			y: y,
			width: 3,
			height: 3,
			fill: 'yellow',
			stroke: 'black',
			strokeWidth: 1
		      });
		gsneg.layer.add(noteR);
		});	
}
// init minimap
function initMap(){
	console.log("Init map")
	gsneg.map.initDone = true;
	if ( !gsneg.permanentLayer ) {
	}
	gsneg.map.tempItems = [];
	var t = $("#container").offset();
	// Small navi
	var data = {
		canH: gsneg.stage.getHeight(),
		canW: gsneg.stage.getWidth(),
		canOffTop: $("#mainTable").scrollTop(),
		canOffLeft: $("#mainTable").scrollLeft(),
		winH: window.innerHeight,
		winW: window.innerWidth,
		mw:200,
		mh:200,
		margin:10
	}
	
	// Calculate position of the map
	var mapTopLeftX = ((data.winW - data.margin) - data.mw) + data.canOffLeft*-1; 
	var mapTopLeftY = ((data.winH - data.margin) - data.mh) + data.canOffTop*-1;
	// Calculate the viewport size in the map
	var wpW = data.mw * (data.winW / data.canW);
	var wpH = data.mh * (data.winH / data.canH);
	// Calculate the position of viewport
	var leftOffMap = data.mw * ((data.canOffLeft*-1) / data.canW) + mapTopLeftX;
	var topOffMap  = data.mh * ((data.canOffTop*-1) / data.canH) + mapTopLeftY;
	
	gsneg.map.outerRect = new Kinetic.Rect({
		x: mapTopLeftX,
		y: mapTopLeftY,
		width: data.mw,
		height: data.mh,
		fill: 'white',
		stroke: 'black',
		strokeWidth: 3,
	      });
	// On click move the map
	gsneg.map.outerRect.on('click', function(evt) {
		console.log(evt);
		var t = $("#container").offset();
		var data = {
			canH: gsneg.stage.getHeight(),
			canW: gsneg.stage.getWidth(),
			canOffTop: t.top,
			canOffLeft: t.left,
			winH: window.innerHeight,
			winW: window.innerWidth,
			mw:200,
			mh:200,
			margin:10
		}
		
		// Calculate position of the map
		var mapTopLeftX = ((data.winW - data.margin) - data.mw) + data.canOffLeft*-1; 
		var mapTopLeftY = ((data.winH - data.margin) - data.mh) + data.canOffTop*-1;
		// Calculate the viewport size in the map
		var wpW = data.mw * (data.winW / data.canW);
		var wpH = data.mh * (data.winH / data.canH);
		// Calculate the position of viewport
		var leftOffMap = data.mw * ((data.canOffLeft*-1) / data.canW) + mapTopLeftX;
		var topOffMap  = data.mh * ((data.canOffTop*-1) / data.canH) + mapTopLeftY;
		
		// Assume that inside the map...
		var x = evt.evt.x - gsneg.map.innerRect.getWidth()/2;
		var y = evt.evt.y - gsneg.map.innerRect.getHeight()/2;
		var scrollX = data.canW * ( (x - ((data.winW - data.margin) - data.mw))/data.mw) ;
		var scrollY = data.canH * ( (y - ((data.winH - data.margin) - data.mh))/data.mh); 
		if ( scrollX < 0)
			scrollX = 0;
		if ( scrollY< 0)
			scrollY = 0;
		$("#mainTable").scrollTop(scrollY);
		$("#mainTable").scrollLeft(scrollX);
	      });
	gsneg.layer.add(gsneg.map.outerRect);
	// Small rect
	gsneg.map.innerRect = new Kinetic.Rect({
		x: leftOffMap,
		y: topOffMap,
		width: wpW,
		height: wpH,
		fill: 'red',
		stroke: 'black',
		strokeWidth: 3,
		draggable: true
	      });
	gsneg.map.innerRect.on("dragmove", function(evt){
			
		});
	gsneg.layer.add(gsneg.map.innerRect);
	
}
function plotMiniMapNote(x, y){
	var t = $("#container").offset();
	// Small navi
	var data = {
		canH: gsneg.stage.getHeight(),
		canW: gsneg.stage.getWidth(),
		canOffTop: t.top,
		canOffLeft: t.left,
		winH: window.innerHeight,
		winW: window.innerWidth,
		mw:200,
		mh:200,
		margin:10
	}
	
	// Calculate position of the map
	var mapTopLeftX = ((data.winW - data.margin) - data.mw) + data.canOffLeft*-1; 
	var mapTopLeftY = ((data.winH - data.margin) - data.mh) + data.canOffTop*-1;
	// Calculate the viewport size in the map
	var wpW = data.mw * (data.winW / data.canW);
	var wpH = data.mh * (data.winH / data.canH);
	// Calculate the position of viewport
	var leftOffMap = data.canOffLeft*-1 * (data.winW / data.canW) + mapTopLeftX;
	var topOffMap  = data.canOffTop*-1 * (data.winH / data.canH) + mapTopLeftY;
	
	var rect = new Kinetic.Rect({
		x: mapTopLeftX,
		y: mapTopLeftY,
		width: data.mw,
		height: data.mh,
		//fill: 'red',
		stroke: 'black',
		strokeWidth: 3
	      });
	gsneg.layer.add(rect);
	return rect;
}
function statuschange(){
	
}

function saveNoteState(){
	gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( gsneg.notes ) );
	gsApi.sessionApi.setValue(gsneg.id(), "connections", JSON.stringify( gsneg.connections ) );
	gsApi.sessionApi.setValue(gsneg.id(), "mergedNotes", JSON.stringify( gsneg.mergedNotes ) );
	gsApi.sessionApi.setValue(gsneg.id(), "deletedNotes", JSON.stringify( gsneg.deletedNotes ) );
}

function clearTable(){
	
	gsneg.notes= [];
	$(".note").remove();
	gsneg.connections = [];
	gsApi.sessionApi.submitDelta(gsneg.id(), {notes: "[]",
					 connections: "[]",
					 deletedNotes: "[]",
					 mergedNotes: "[]",
					 lTree: "",
					 rTree: ""
					 });
}
function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      }
      
(function() {
	gsApi.sessionApi.testSocket();
	 var htmlCanvas = document.getElementById('bgCanvas'),
       context = htmlCanvas.getContext('2d');
	gsneg.canvas = htmlCanvas;
	gsneg.context = context;
    function redraw() {
        context.strokeStyle = 'black';
        context.lineWidth = '5';
        context.strokeRect(0, 0, window.innerWidth, window.innerHeight);
    }

    function resizeCanvas() {
	
	$("#wrapper").css("height", window.innerHeight)
			.css("width", window.innerWidth);
	// Set the minimap location
	var t = $("#container").offset();
        redraw();
    }
	
	console.log($("#gsn-main"));
	 var initHangout = function(apiInitEvent) {
		 // Init graphics...
		 
		 //
	      if (apiInitEvent.isApiReady) {
		
	    	 // Add on event handlers. gapi is DEPRECATED!!!!
	        gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {	        	
			//updateLocalState(stateChangeEvent.state, stateChangeEvent);
	        });
	        gapi.hangout.onParticipantsChanged.add(function(partChangeEvent) {
	        	//participantsChanged(partChangeEvent.participants);
	        });
		
		gsApi.sessionApi.testSocket();
		gsApi.sessionApi.socket.on("state", updateLocalStateWrapper);
		gsApi.sessionApi.socket.on("message", onMessageReceivedWrapper);
		
		// Join room on the server, room id is the hangout id
	        gsApi.sessionApi.join( gsneg.id(), function(){
			gsApi.sessionApi.getState(gsneg.id(), function(data){
				var state = JSON.parse(data);
				if( !state.setup ){
					initState();
				}else{
					console.log("Set up")
					updateLocalStateWrapper(state);
					//loadState();
				}
				});	
			
			});
	        
	        if (!gsneg.vars.participants_) {
	          var initParticipants = gapi.hangout.getParticipants();
	          if (initParticipants) {
	        	  participantsChanged(initParticipants);
	          }
	        }
	        
		$("#ADDNOTE").click(function(){
			$("#ADDNOTE").block({message: null});
			
	        	var note = gsneg.createNewNote();
	        	id = note.data("noteId");
	        	// Save to state
	        	gsneg.notes.push({  id: id, 
				top: $(note).position().top,
				left: $(note).position().left,
				title: note.data("title"),
				desc: note.data("desc"),
				parents: []});
			gsApi.sessionApi.setValue(gsneg.id(), "notes", JSON.stringify( gsneg.notes ) );
			$("#ADDNOTE").unblock();
			$(this).data("dont", "");
	        	// Notify message
	        });
		
	        $("#SAVE").click(function(){
	        	console.log("Save");
			var btn = {};
			btn[locale.currentDictionary.Save] = function(){
	        	            	   var nam = $(this).find("#name").val();
	        	            	   $(this).find("#name").val("");
	        	            	   if( nam.length > 0 ){
	        	            		   gsneg.saveTree( nam );
	        	            		   $( this ).dialog( "close" );
	        	            	   } 	
	        	               };
			btn[locale.currentDictionary.Cancel] = function() {
		        	              $( this ).dialog( "close" );
		        	            };
					    
	        	$("#saveDialog").dialog({
	        	      autoOpen: true,
	        	      //height: 300,
	        	      //width: 350,
	        	      modal: true,
			      title: locale.currentDictionary.Save,
			      close: function() {
					$(this).find("#name").val("");
				},
	        	      buttons: btn
	        	});
	        });
	        $("#LOAD").click(function(){
	        	var btn = {};
			btn[locale.currentDictionary.Load] = function(){
					
	        	            	   try{	        	            		   
	        	            		   var nam = $(this).find(":checked").val();
						   console.log(nam);
	        	            		   if(nam)
	        	            			   gsneg.LoadTree(nam);
	        	            	   }catch(e)
	        	            	   {
	        	            		console.log(e)
	        	            	   }
	        	            	   $( this ).dialog( "close" );
	        	               } 
			btn[locale.currentDictionary.Cancel] = function() {
		        	              $( this ).dialog( "close" );
		        	            };
	        	$("#loadDialog").dialog({
	        	      autoOpen: true,
	        	      //height: 300,
	        	      //width: 350,
	        	      modal: true,
	        	      open: function(){
				console.log("dsada");
				console.log("Loading state list");
				var states = gsneg.savedStates;//JSON.parse( gapi.hangout.data.getValue("savedStates") );
	        	    	if(!states)
	        	    		return false;
	        	    	var elem = $(this).find(".radio")[0];
				console.log(elem);
	        	    	  $( elem ).children().remove();
	        	    	  for ( var i = 0; i < states.length; i++ ){
	        	    		  $( elem ).append( '<input type="radio" name="tree" value=' + states[i].name + ' class="text ui-widget-content ui-corner-all"><span>' + states[i].name + '</span>' )
	        	    	  }
				  return true;
	        	      },
			      close: function(){
				$(this).remove();
			      },
	        	      buttons: btn,
				close: function() {
					$(this).find(".radio").children().remove();
				}
	        	})
	        });
		$("#COMPARE").click(function(){
			$.blockUI();
			gsApi.goalApi.getGoalAutoComplete(function(){	
				$("#compateDialog").dialog({
				      autoOpen: true,
				      height: 260,
				      width: 560,
				      modal: true,
				      close: function(){
					$("#leftTreeValue").val("");
					$("#rightTreeValue").val("");
					$("#leftTree").val("");
					$("#rightTree").val("");
					$("#leftTree").text("");
					$("#rightTree").val("");
				      },
				      created: function(){
					
				      },
				      open: function(){
					$.unblockUI();
					$("#leftTree").autocomplete({source: gsApi.goalApi.goalAutocomplete,
						select: function(event, ui){
							console.log(ui);
								$("#leftTreeValue").val(ui.item.key);	
							}});
					$("#rightTree").autocomplete({source: gsApi.goalApi.goalAutocomplete,
								     select: function(event, ui){
								$("#rightTreeValue").val(ui.item.key);	
							}});
					console.log("Loading state list");
					  return true;
				      },
				      buttons: {
					       "Load": function(){
							var lTree = $("#leftTreeValue").val();
							var rTree = $("#rightTreeValue").val();
							if ( !lTree && rTree) {
								log("Left only")
								lTree = rTree;
							}
							if ( lTree ) {
								// Build first the left tree, then the right one
								buildGoalTree(lTree, function(data){
									var position = gsneg.conf.treeDefaultPosition;
									var loc = gsneg.getLocationData();
									var pos = ({ y: Math.round( loc.canvasScrollTop + (loc.viewportHeight/2) ), x: Math.round(loc.canvasScrollLeft + (loc.viewportWidth/2) ) });
									
									gsneg.loadGSTree(data, pos);
									
									// Calculate right tree pos
									$.each(gsneg.notes, function(){position.x = Math.max(this.left, position.x);});
									position.x = position.x + gsneg.conf.treePadding;
									log('Pos for right [{0},{1}]'.format(position.x, position.y));
									// Build Right tree
									if (rTree) {
										log('rTree')
										buildGoalTree(rTree, function(data){
												log('get && build  rTree done');
												log(data);
												gsneg.loadGSTree(data, position);
											});
										
									}
									
								});
								
							}
						   $( this ).dialog( "close" );
					       },
						  Cancel: function() {
						      $( this ).dialog( "close" );
						    }},
				})
			});
		});
		$("#COMMIT").click(function(){
			$.blockUI();
			var deleted = gsneg.deletedNotes;
			var buttons = {};
			buttons[locale.currentDictionary.CreateNew] = function(){
					$.blockUI();
					gsneg.saveTreeToGS(false);
					$( this ).dialog( "close" );
					$.unblockUI();
				}
			
			if ( deleted || deleted.length > 0 ){
				buttons[locale.currentDictionary.Replace] = function(){
					$.blockUI();
					gsneg.saveTreeToGS(true);
					$( this ).dialog( "close" );
					$.unblockUI();
				}
			}
			$("#commitDialog").dialog({
				      autoOpen: true,
				      height: 260,
				      width: 560,
				      modal: true,
				      close: function(){
					
				      },
				      open: function(){
					$.unblockUI();
				      },
				      buttons: buttons
			});
		});
		$("#CLEAR").click(function(){
	        	clearTable(); 
	        });
		
	        $("#LANG_JA").click(function(){
			locale.setLanguage('ja');
			log("ja");
	        });
		$("#LANG_EN").click(function(){
			locale.setLanguage('en');
			log("en");
	        });
		
		// Event handler for the window resize 
	        
	        gsneg.stage = new Kinetic.Stage({container: "container"});
	        
		window.addEventListener('resize', resizeCanvas, false);
	        
	        gsneg.stage.setWidth( 3000 );
		gsneg.stage.setHeight( 3000 );
		
		resizeCanvas();
		gsneg.layer = new Kinetic.Layer();
		gsneg.map.layer = new Kinetic.Layer();
		gsneg.layer.on('mousemove', function(e) {
			console.log(e);
			var offsetX = e.evt.offsetX || e.evt.layerX,
			    offsetY = e.evt.offsetY || e.evt.layerY;
			text = "";//'position mouse on canvas: '+'x: ' + offsetX + ', y: ' +  offsetY; 
		    });
	        try{
	        gsneg.stage.add(gsneg.layer);
		gsneg.map.layer.setZIndex(3);
	        }catch(e){}
		try {
			gsneg.map.layer.setZIndex(30);
			gsneg.stage.add(gsneg.map.layer);
			
		} catch(e) {
			
			
		}
	        // Init is done only once
	        $(".state").click(function(){
	        	$(".state").removeClass("selected");
	        	$(this).addClass("selected");
	        	var states = $(".state");
	        	for(var i = 0; i < states.length; i++){
	        		if(this== states[i]){
	        			notifyState(i);
	        			break;
	        		}
	        		
	        	}
	        });
	        
	        $("#topic").editable(function(value){
	        	if( value )
	        		notifyTopic(value);
				return value;
			},{event: "dblclick"});
	        $("#description").editable(function(value){
	        	if( value )
	        		notifyDescription(value);
				return value;
			},{event: "dblclick"});
	        
	        gapi.hangout.onApiReady.remove(initHangout);
	        $("#overlay").remove();
		render();
	      }
	    };
	    
	    // Start the process when app is ready
	    gapi.hangout.onApiReady.add(initHangout);
	    gsneg.init();
})();

