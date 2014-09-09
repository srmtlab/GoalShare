/**
 * User login related functionality and API access
 */

var userAPI = {
	userBaseUri: "http://collab.open-opinion.org/resource/Person/",
	getUserByFB : function(fbURI) {

		var res = null;
		$.ajax("/api/user.pl", {
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
		if (this.users == null)
			this.users = this.getUsers();
		var res = null;
		for ( var i = 0; i < this.users.length; i++) {
			if (this.users[i].personURI == URI)
				return this.users[i];
		}
		return null;

		$.ajax("/api/user.pl", {
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
		$.ajax("/api/user.pl", {
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
		$.get("/api/user.pl", {
			command : "add",
			userURI : userURI,
			name : name,
			imageURI : imageURI,
			fbURI : fbURI
		}).done(callback);
	},
	removeUser : function(fbURI) {
		var user = userAPI.getUserByFB(fbURI);
		$.get("/api/user.pl", {
			command : "remove",
			userURI : user.person.personURI
		});
	},
	getUserFBInfo: function(name, cb){
		var fburl = "http://graph.facebook.com/{0}?callback=?".format(name);
		$.getJSON(fburl, cb);
	} 
};
$(document).ready(function() {
	userAPI.users = userAPI.getUsers().users;
});

// User singleton object, contains the current user information
var user = {
	anonUser : {
		name : "Anonymous",
		imageURI : "/image/nobody.png",
		userURI : "http://collab.open-opinion.org/resource/Person/85dd5be5-0490-6af8-827b-2b71e588a36b",
		fbID : "00000000",
		fbURI : "http://collab.open-opinion.org/resource/Person/85dd5be5-0490-6af8-827b-2b71e588a36b"

	},
	debug : false,
	name : "Anonymous",
	URI : "http://collab.open-opinion.org/resource/people/85dd5be5-0490-6af8-827b-2b71e588a36b",
	// With FB //http://graph.facebook.com/USERNAME_OR_USERID/picture?type=large
	//http://graph.facebook.com/1434308153516474/picture?type=large
	
	imageURI : "image/nobody.png",
	email : null,
	fbId : "00000000",
	loginStatus : "loggedIn",
	translateUser : function(name) {
		if (name == this.anonUser.name) {
			return Locale.dict.Anonymous;
		} else
			return name;
	},
	// user.set(response.id, response.name, response.link,
	// "http://graph.facebook.com/" + response.id + "/picture?type=large",
	// response.email);
	set : function(fbId, name, fbURI, imageURI) {

		var user = userAPI.getUserByFB(fbURI);
		// If user is not already added to collab.open-opinion.org, add it
		// there/
		var userURI = 'http://collab.open-opinion.org/resource/Person/'
				+ guid();
		if (!(user.person.personURI)) {
			userAPI.addUser(userURI, name, imageURI, fbURI);
			user = userAPI.getUserByFB(fbURI);
		}
		this.fbId = fbId;
		this.name = name;
		this.URI = user.person.personURI;
		this.imageURI = imageURI;
		this.loginStatus = "loggedIn";

		createCookie("userFBId", this.fbId);
		createCookie("userName", this.name);
		createCookie("userURI", this.URI);
		createCookie("userImageURI", this.imageURI);
		createCookie("userEmail", this.email);
		createCookie("userLoginStatus", this.loginStatus);
	},
	saveCookie : function() {

	},
	reset : function() {
		this.debug = true;
		this.fbId = this.anonUser.fbID;
		this.name = this.anonUser.name;
		this.URI = this.anonUser.userURI;
		this.imageURI = this.anonUser.imageURI;
		this.email = "-";
		this.loginStatus = "loggedIn";

		createCookie("userFBId", this.fbId);
		createCookie("userName", this.name);
		createCookie("userURI", this.URI);
		createCookie("userImageURI", this.imageURI);
		createCookie("userEmail", this.email);
		createCookie("userLoginStatus", this.loginStatus);
	},
	setDebug : function() {
		this.debug = true;
		this.fbId = "123456";
		this.name = "Debug User";
		this.URI = "http://test.com";
		this.imageURI = "/image/nobody.png";
		this.email = "teemu@toralab.org";
		this.loginStatus = "loggedIn";

		createCookie("userFBId", this.fbId);
		createCookie("userName", this.name);
		createCookie("userURI", this.URI);
		createCookie("userImageURI", this.imageURI);
		createCookie("userEmail", this.email);
		createCookie("userLoginStatus", this.loginStatus);
	},
	checkLoginStatus : function() {
		return (this.loginStatus == "loggedIn");

	},
	getFBUserId: function(uri){
		var test = new RegExp("(((https?://)?(www\\.)?facebook\\.com/))?(.*/)?([a-zA-Z0-9.]*)($|\\?.*)");
		var res = test.exec(uri);
		
		res = $.grep(res, function(o,i){
			//console.log(o)
			if(  !o )
				return false;
			if(  o == "" )
				return false;
			if(  o.indexOf("?" ) >= 0)
				return false;
			if(  o.indexOf("www" ) >= 0)
				return false;
			if(  o.indexOf("http" ) >= 0)
				return false;
			if(  o.indexOf("facebook" ) >= 0)
				return false;
			return true;
		});
		var retval = res[0];
		if(retval)
			retval = retval.replace("groups/", "");
		retval = retval.replace("/", "")
		return retval;
	},
	openCreateUserByUriDialog: function(callback){
		//console.log("test");
		var selId = guid();
		this.de = selId;
		var content = $("<div id=\"{"+selId+"}\" />");
		var uriId = guid();
		var nameId = guid();
		var destId = guid();
		console.log(""+Locale.dict.Name +  Locale.dict.SOMEURI +  uriId + destId+ nameId);
		$(content).append( $("<div style=\"float:left;clear:right;\"><!--<form><label style=\"width:150px;\">{0}</label><input id=\"{4}\" type=\"text\" name=\"name\"><br>--><label style=\"width:150px;\">{1}</label><input id=\"{2}\" type=\"text\" name=\"uri\"><div id={3} class=\"addUserInfo\" /><!--</form>--></div>".format(Locale.dict.Name, Locale.dict.SOMEURI, uriId, destId, nameId)) );
		
		//console.log("test");
		var buttonsObj = {};
		buttonsObj[Locale.dict.Act_Complete] = function() {
			console.log("ok");
			//https://graph.facebook.com/oca.hake/picture
			//(?:(?:http|https):\/\/)?(?:www.)?facebook.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[?\w\-]*\/)?(?:profile.php\?id=(?=\d.*))?([\w\-]*)?
			//userAPI.
			var fbURI = $("#"+uriId).val();
			var name = user.getFBUserId(fbURI);
			var imageURI = "https://graph.facebook.com/{0}/picture".format(name);
			console.log("Creating[{0}][{1}][{2}][{3}]".format(fbURI, name, imageURI));
			userAPI.getUserFBInfo(name, function(data){
				console.log(data);
				if( data.name ){
					// Valid user
					var userURI = userAPI.userBaseUri + guid();
					console.log("Creating[{0}][{1}][{2}][{3}]".format(userURI, name, imageURI, fbURI));
					//return;
					userAPI.addUser(userURI, data.name, imageURI, fbURI, callback);
				}
				else{
					console.log();		
				}
				
			});
			$(this).dialog("close");
		};
		//console.log("test");
		buttonsObj[Locale.dict.Act_Cancel] = function() {
			$(this).dialog("close");
		};
		console.log("test");
		this.dd = content;
		$(content).dialog({
				modal : true,
				title : Locale.dict.Add,
				//zIndex : 10000,
				autoOpen : true,
				width : 'auto',
				resizable : false,
				open: function(){
					console.log(this);
					var btn = $(this).find(":button:contains('"+Locale.dict.Act_Complete+"')");
					console.log(btn);
					$(btn).attr("disabled", true);
					$("#"+uriId).bind('textchange',function(event, prevtext){
						$("#"+destId).empty();
						var uri = $(this).val();
						console.log(uri);
						var name = user.getFBUserId(uri);
						console.log(name);
						var imageURI = "https://graph.facebook.com/{0}/picture".format(name);
						userAPI.getUserFBInfo(name, function(data){
							console.log(data);
							
							if(data.name){
								$("#"+destId).append( 
										$("<div style=\"float:left;\"><img src=\"" + imageURI + "\" height=\"50\" width=\"50\" /><span>" + data.name + "</span> </div>")
										
									)
								$(btn).attr("disabled", false);
							}
							else{
								$(btn).attr("disabled", true);
							}
								
						});
						
					});
				},
				buttons : buttonsObj,
				close : function(event,ui) {$(this).remove();}
		});
		
	}
};
