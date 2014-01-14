//　こっちが，initのハンドラ
//window.fbAsyncInit = function() {
//    FB.init({
//	appId      : '1384168691796136', // AppID
//	channelUrl : 'channel.html', // channel.htmlのURL
//	status     : true, // check login status
//	cookie     : true, // enable cookies to allow the server to access the session
//	xfbml      : true  // parse XFBML
//	});
//};

// こちらでSDKをロード
//(function(d){
//    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
//    if (d.getElementById(id)) {return;}
//    js = d.createElement('script'); js.id = id; js.async = true;
//    js.src = "//connect.facebook.net/en_US/all.js";
//    ref.parentNode.insertBefore(js, ref);
//}(document));

function logFBUser(){
	//fbId, name, userURI, imageURI, email
	FB.api('/me??locale=ja_JP', function(response) {
		console.log(response);
		user.set(response.id, response.name, response.link, "http://graph.facebook.com/" + response.id + "/picture?type=large");
        });
}


window.fbAsyncInit = function() {
    // init the FB JS SDK
    FB.init({
      appId      : '255123151304199',                        // App ID from the app dashboard
      //channelUrl : 'http://radish.ics.nitech.ac.jp/goalshare//channel.html', // Channel file for x-domain comms
      channelUrl : '//localhost/channel.html',
      status     : true,                                 // Check Facebook Login status
      xfbml      : true,                                  // Look for social plugins on the page
      oauth		 : true
    });
    // Additional initialization code such as adding Event Listeners goes here
    // Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
    // for any authentication related change, such as login, logout or session refresh. This means that
    // whenever someone who was previously logged out tries to log in again, the correct case below 
    // will be handled. 
    FB.Event.subscribe('auth.authResponseChange', function(response) {
    	// Here we specify what we do with the response anytime this event occurs. 
    	if (response.status === 'connected') {
    		// The response object is returned with a status field that lets the app know the current
    		// login status of the person. In this case, we're handling the situation where they 
    		// have logged in to the app.
    		//http://graph.facebook.com/USERNAME_OR_USERID/picture?type=large
    		console.log("Connected");
    		logFBUser();
    		
    	} else {
    		user.reset();
	    	if (response.status === 'not_authorized') {
	    	
	    		// In this case, the person is logged into Facebook, but not into the app, so we call
	    		// FB.login() to prompt them to do so. 
	    		// In real-life usage, you wouldn't want to immediately prompt someone to login 
	    		// like this, for two reasons:
	    		// (1) JavaScript created popup windows are blocked by most browsers unless they 
	    		// result from direct interaction from people using the app (such as a mouse click)
	    		// (2) it is a bad experience to be continually prompted to login upon page load.
	    		console.log("Not auth");
	    		FB.login();
	    	} else {
	    		// In this case, the person is not logged into Facebook, so we call the login() 
	    		// function to prompt them to do so. Note that at this stage there is no indication
	    		// of whether they are logged into the app. If they aren't then they'll see the Login
	    		// dialog right after they log in to Facebook. 
	    		// The same caveats as above apply to the FB.login() call here.
	    		console.log("Not in FB");
	    		FB.login();
	    	}
    	}
    });
  };

  
  // Load the SDK asynchronously
  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     //ja_JP
     //js.src = "//connect.facebook.net/en_US/all.js";
     js.src = "//connect.facebook.net/ja_JP/all.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
  
  
  (function(){
	  
	  
	  $(".login").click(function(){
		  FB.logout();
	  });
  });