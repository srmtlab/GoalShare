//　こっちが，initのハンドラ
window.fbAsyncInit = function() {
    FB.init({
	appId      : '1384168691796136', // AppID
	channelUrl : 'channel.html', // channel.htmlのURL
	status     : true, // check login status
	cookie     : true, // enable cookies to allow the server to access the session
	xfbml      : true  // parse XFBML
	});
};

// こちらでSDKをロード
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));
