/*
State 

{ "connections" : [
      {
         "parent" : "http://collab.open-opinion.org/resource/Goal/63860698-c358-6e2e-b7e5-4f7dfca304ec",
         "child" : "http://collab.open-opinion.org/resource/Goal/40d49ed6-9b29-55d2-edd5-48a2b5b24ab2"
      },
      
   ],
   "goals" : [
      {
         "creator" : null,
         "status" : "NotStarted",
         "dateTime" : "2014-06-08T11:28:05+09:00",
         "desiredTargetDate" : null,
         "cntSubGoals" : null,
         "desc" : null,
         "url" : "http://collab.open-opinion.org/resource/Goal/63860698-c358-6e2e-b7e5-4f7dfca304ec",
         "requiredTargetDate" : null,
         "completedDate" : null,
         "title" : "「病院に行くとき、どの科に行けば良いのかわからない」を解決するアプリを作る",
         "creatorUrl" : "http://test.com"
      },
}
*/

var gsApi = {
    
    baseUrl: "https://radish.ics.nitech.ac.jp/api/",
    socketUrl: "https://radish.ics.nitech.ac.jp",
    socketResource: {path:'/gsneg/socket.io'},
    nodeWidth: 100,
    nodePadding: 50,
    
    requests: {
        
    },
    sessionApi: {
        socket: null,
        channelName: "session",
        
        testSocket: function(){
            if ( !gsApi.sessionApi.socket ) {
                gsApi.sessionApi.socket = io.connect( gsApi.socketUrl, gsApi.socketResource ); 
            }
        },
        join: function(id, cb){
            if ( !cb ) {
                cb = function(){};
            }
    
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "join" } ), cb);
        },
        leave: function(id, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "leave" } ), cb);
        },
        sendMessage: function(id, message, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "message", message: message} ), cb);
        },
        setState: function(id, state, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "setState", state: state} ), cb);
        },
        getState: function(id, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "getState"} ), cb);
        },
        setValue: function(id, key, value, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "setValue", key: key, value: value } ), cb);
        },
        submitDelta: function(id, values, cb){
            if ( !cb ) {
                cb = function(){};
            }
            $.each(Object.keys( values ), function(i,o){
                
                gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "setValue", key: this, value: values[this] } ), cb);
                });
        },
        getValue: function(id, key, value, cb){
            if ( !cb ) {
                cb = function(){};
            }
            gsApi.sessionApi.socket.emit("session", JSON.stringify( { id: id, command: "getValue", key: key} ), cb);
        }
    },
    goalApi:{
        getResourceUrl: function(id ){
        //http://collab.open-opinion.org/resource/Goal
            var reg = /^http:\/\/collab.open-opinion.org\/resource\/Goal\//;
            if(reg.test(id))
                return id; 
            else
                return "http://collab.open-opinion.org/resource/Goal/"+id;
        },
        
        goalAutocomplete: null,
        // Get autocomplete formatted goals
        getGoalAutoComplete: function(callback){
           $.getJSON(gsApi.baseUrl + "autocomplete.pl", {
                    type : "goals"
            }, function(data) {
                    
                    gsApi.goalApi.goalAutocomplete = $.map(data.goals,function(n, i){
                            return { value: n.label, key: n.value };
                        });
                    callback(gsApi.goalApi.goalAutocomplete);
            }); 
        },
        // Get the whole goaltree with one member goal
        getGoalTree: function(goalURI, callback){
            $.getJSON(gsApi.baseUrl + "/goal.pl", {
                    command: "tree",
                    goalURI: goalURI 
                    
            }, function(data) {
                    var data2 = {};
                    log(data);
                    data2.goals = $.map(data.goals, function(o,i){
                        return { url: o.url,
                                title: o.title,
                                desc: o.desc}
                    } );
                    data2.connections = data.connections;
                    callback(data2);
            });
        },
        addGoal: function(para, callback){        
                if (!para.title ) 
                    return;
                var localGoalURI = "http://collab.open-opinion.org/resource/Goal/" + para.id;
                if( para.gsId ){
                        localGoalURI = para.gsId;
                }
                
                var parameters = {
                        goalURI : localGoalURI,
                        //parentGoalURI : parentGoalURI,
                        title : "",
                        description : "",
                        //reference : reference,
                        //creator : creator,
                        //createdDate : createdDate,
                        //status : status,
                        //locationURI : locationURI,
                        //goalWisherURI : goalWisherURI,
                        //relatedList : relatedList.join(";"),
                        createdDate: (new Date(Date.now()).format(locale.dictionaries.en.X_FullDateFormat)+getTimezoneOffset()),
                };
                if (para.gsId) {
                    parameters.update = "true"
                }
                $.extend( true, parameters, para );
                parameters.description = parameters.desc;
                // If generated from an issue, create link between them.
                log($.get(gsApi.baseUrl + "insert_goal.pl", parameters));
        
        },
        deleteGoal: function(ids, callback){
            //if(!callback) callback = function(d){console.log(d);};
                gsApi.goalApi.clearParentGoals(ids)
                gsApi.goalApi.clearChildGoals(ids);
                $.getJSON(gsApi.baseUrl + "goal.pl", {
                      command: "delete",
                      goalURI: ids,
                      deleteConfirmation: "deleteTrue",
                      name: "ok"
              });
        },
        getGoals: function(ids, callback){
            if(!callback) callback = function(d){console.log(d);};
              $.getJSON(gsApi.baseUrl + "/query_goals.pl", {
                      goalURI: ids
              }, callback);
        },
        linkGoal: function(parent, child, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "add",
			parentURI: parent,
			childURI: child
		}, callback);
	},
        unlinkGoal: function(parent, child, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "remove",
			parentURI: parent,
			childURI: child
		}, callback);
	},
        clearParentGoals: function(child, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "clearParents",
			childURI: child
		}, callback);
	},
        clearChildGoals: function(parent, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "clearChildren",
			parentURI: parent
		}, callback);
	},
        getParentsGoals: function(child, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "getParents",
			childURI: child
		}, callback);
	},
        getChildGoals: function(parent, callback){
		if(!callback) callback = function(d){console.log(d);};
		$.getJSON(gsApi.baseUrl + "/goal_parent.pl", {
			command: "getChildren",
			parentURI: parent
		}, callback);
	},
        
    },
    
    userApi: {
	getGPURI: function(id){
	    return "https://plus.google.com/" + id;
	},
	getUserByFB : function(fbURI) {

		var res = null;
		$.ajax( gsApi.baseUrl + "/user.pl", {
			async : false,
			data : {
				command : "getFB",
				fbURI : fbURI
			}
		}).done(function(data) {
			res = data;
		});
		return res;
	},
	getUserByURI : function(URI) {
		var users = this.getUsers();
		var res = null;
		for ( var i = 0; i < this.users.length; i++) {
			if (this.users[i].personURI == URI)
				return this.users[i];
		}
		return null;

		$.ajax( gsApi.baseUrl + "/user.pl", {
			async : false,
			data : {
				command : "getByURI",
				userURI : URI
			}
		}).done(function(data) {
			res = data;
		});
		return res;
	},
	getUsers : function() {
		var res = null;
		$.ajax(gsApi.baseUrl + "/user.pl", {
			async : false,
			data : {
				command : "get"
			}
		}).done(function(data) {
			res = data;
		});
		return res;
	},
	addUser : function(userURI, name, imageURI, fbURI, callback) {
		$.get( gsApi.baseUrl + "/user.pl", {
			command : "add",
			userURI : userURI,
			name : name,
			imageURI : imageURI,
			fbURI : fbURI
		}).done(callback);
	},
	removeUser : function(fbURI) {
		var user = userAPI.getUserByFB(fbURI);
		$.get(gsApi.baseUrl + "/user.pl", {
			command : "remove",
			userURI : user.person.personURI
		})
		
	},
	addWisherFB: function(goalURI, wisherFBURI, cb) {
	    if ( !cb ) {
		cb = function(){};
	    }
		var user = gsApi.userApi.getUserByFB(wisherFBURI);
		$.get(gsApi.baseUrl + "/wisher.pl", {
			command : "add",
			goalURI : goalURI,
			wisherURI: user.person.personURI
		}).done(cb);
	}
    },
    
    init: function(){
        // Fetch initial data
        //gsApi.goalApi.getGoalAutoComplete(log);
    }
}

/*
 *     o  o
 *     o
 *  o  o  o
 *    o o
 */
function buildGoalTree(uri, cb) {
    if (uri == "") {
        uri = "http://collab.open-opinion.org/resource/Goal/40d49ed6-9b29-55d2-edd5-48a2b5b24ab2";
    }
    gsApi.goalApi.getGoalTree(uri,function(data){
        //console.log(data);
        var levels = [];
        // Build goal levels
        
        // Get those goals on the first level, that doesn't have a parent 
        var currentLevel = $.grep(data.goals, function(o){
            var aina = $.grep( data.connections, function(oo){
                return o.url == oo.child;
            });
            aina.length > 0;
            return aina.length > 0;
        }, true);
        levels.push(currentLevel);
        
        while (1==1) {
            var childConnections = $.grep(data.connections, function(o){
                    return ($.grep(currentLevel, function(oo){ return o.parent == oo.url; })).length > 0;
                });
            var newLevel = $.grep(data.goals, function(o){ return($.grep(childConnections, function(oo){ return o.url == oo.child; })).length > 0; });
            if (newLevel.length<=0){
                break;
            }    
            levels.push(newLevel);
            currentLevel = newLevel;
        }
        // Now we have goals in their levels
        // Order levels by parent index to avoid crossing links
        if (levels.length > 1) {
            for (var i = 1; i < levels.length; i++) {
                levels[i].sort(function(a, b){return findParentIndex(levels[i-1], a.url, data.connections) - findParentIndex(levels[i-1], b.url, data.connections);});
            }
        }
        console.log(levels);
        // Calculate max width
        var maxSiblings = 0;
        var n = levels.length;
        while (n--)
            maxSiblings = Math.max(maxSiblings, levels[n].length);
        
        var treeWidth = maxSiblings * gsApi.nodeWidth + (maxSiblings-1) * gsApi.nodePadding;
        var yJump = gsneg.conf.noteHeight*1.5;
        var minX = 0;
        // Calculate tree node positions
        for (var i = 0; i < levels.length; i++) {
            var r = 0;
            var maxR = Math.floor(levels[i].length/2);
            var neven = (levels[i].length % 2) != 0
            if ( neven ) {
                pos = Math.floor(levels[i].length/2);
                levels[i][pos].xOffset = 0;
                levels[i][pos].yOffset = i*yJump;   
            }
            for (var j = 0; j < maxR && levels[i].length > 1; j++) {
                var l, r;
                var jump = gsneg.conf.noteWidth*1.4;
                if (neven) {
                    
                    l = Math.floor(levels[i].length/2)- 1 - j;
                    r = Math.floor(levels[i].length/2)+ 1 + j;
                }else{
                    l = Math.floor(levels[i].length/2) -1 - j;
                    r = Math.floor(levels[i].length/2) + j;
                }
                minX = Math.min(minX, (j+1) * jump * -1)
                // Set
                levels[i][l].xOffset = (j+1) * jump * -1;
                levels[i][l].yOffset = i * yJump;
                          
                levels[i][r].xOffset = (j+1) * jump;
                levels[i][r].yOffset = i * yJump;
            }
        }
        $.each(data.goals, function(){this.xOffset = this.xOffset+ minX*-1});
        cb(data);
        
    });
}
function findParentIndex(parentLevel, currentNodeId, connections) {
    var parentId = "";
    for (var i = 0; i < connections.length; i++) {
        if (connections[i].child == currentNodeId) {
            parentId = connections[i].parent;
            break;
        }
    }
    if (parentId == "")
        return -1;
    // Get index
    for (var i = 0; i < parentLevel.length; i++) {
        if (parentLevel[i].url == parentId) {
            return i;
        }
    }
    return -1;
        
    
}

$(function() {
        gsApi.init();
    }
)