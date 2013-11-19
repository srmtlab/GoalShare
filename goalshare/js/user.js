var user={
	debug: false,
	name: null,
	URI: null,
	// With FB //http://graph.facebook.com/USERNAME_OR_USERID/picture?type=large
	imageURI: null,
	email: null,
	fbId: null,
	loginStatus: "unknown",
	
	//user.set(response.id, response.name, response.link, "http://graph.facebook.com/" + response.id + "/picture?type=large", response.email);
	set: function(fbId, name, userURI, imageURI, email){
		if( !this.debug ){
			this.fbId = fbId;
			this.name = name;
			this.URI = userURI;
			this.imageURI = imageURI;
			this.email = email;
			this.loginStatus = "loggedIn";
	
			createCookie("userFBId", this.fbId );
			createCookie("userName", this.name );
			createCookie("userURI", this.URI );
			createCookie("userImageURI", this.imageURI);
			createCookie("userEmail", this.email );
			createCookie("userLoginStatus", this.loginStatus );
		}
	},
	saveCookie: function(){
		
	},
	reset: function(){
		if( !this.debug ){
			this.name = null;
			this.URI = null
			this.email = null;
			this.imageURI = null;
			this.fbId = null;
			this.loginStatus = "unknown";
			
			eraseCookie("userFBId");
			eraseCookie("userName");
			eraseCookie("userURI");
			eraseCookie("userImageURI");
			eraseCookie("userEmail");
			eSraseCookie("userLoginStatus");
		}
	},
	setDebug: function(){
		this.debug = true;
		this.fbId = "123456";
		this.name = "Debug User";
		this.URI = "http://test.com";
		this.imageURI = "/image/nobody.png";
		this.email = "teemu@toralab.org";
		this.loginStatus = "loggedIn";

		createCookie("userFBId", this.fbId );
		createCookie("userName", this.name );
		createCookie("userURI", this.URI );
		createCookie("userImageURI", this.imageURI);
		createCookie("userEmail", this.email );
		createCookie("userLoginStatus", this.loginStatus );
	}
};
user.setDebug();