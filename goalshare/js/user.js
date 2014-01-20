/**
 * User login related functionality and API access
 */

var userAPI = {
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
	addUser : function(userURI, name, imageURI, fbURI) {
		$.get("/api/user.pl", {
			command : "add",
			userURI : userURI,
			name : name,
			imageURI : imageURI,
			fbURI : fbURI
		});
	},
	removeUser : function(fbURI) {
		var user = userAPI.getUserByFB(fbURI);
		$.get("/api/user.pl", {
			command : "remove",
			userURI : user.person.personURI
		});
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
};
