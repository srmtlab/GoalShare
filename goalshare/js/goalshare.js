function localizeUI(){
	if( $.url().param("lang") ){
		Locale.setLanguage($.url().param("lang"));
		$("[data-localize]").localize("locale", { language: $.url().param("lang") });
		
	}else{
		$("[data-localize]").localize("locale", { language: "en" });
	}
}

//Common
Date.prototype.format = function(format) //author: meizz
	{
	  var o = {
	    "M+" : this.getMonth()+1, //month
	    "d+" : this.getDate(),    //day
	    "h+" : this.getHours(),   //hour
	    "m+" : this.getMinutes(), //minute
	    "s+" : this.getSeconds(), //second
	    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
	    "S" : this.getMilliseconds() //millisecond
	  }
	
	  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
	    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	  for(var k in o)if(new RegExp("("+ k +")").test(format))
	    format = format.replace(RegExp.$1,
	      RegExp.$1.length==1 ? o[k] :
	        ("00"+ o[k]).substr((""+ o[k]).length));
	  return format;
	}
	
	
function pad(number, length){
    var str = "" + number;
    while (str.length < length) {
        str = '0'+str;
    }
    return str;
}
function insertParam(key, value)
{
    key = encodeURI(key); value = encodeURI(value);

    var kvp = document.location.search.substr(1).split('&');

    var i=kvp.length; var x; while(i--) 
    {
        x = kvp[i].split('=');

        if (x[0]==key)
        {
            x[1] = value;
            kvp[i] = x.join('=');
            break;
        }
    }

    if(i<0) {kvp[kvp.length] = [key,value].join('=');}

    //this will reload the page, it's likely better to store this until finished
    document.location.search = kvp.join('&'); 
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

var Locale = {
		// Default set
		dict: {
			"GoalShare": "GoalShare",
			"Slogan": "Share public goals → Find collaborators",
			"Nav_Issues": "Issues",
			"Nav_Goals": "Goals",
			"Nav_Maps": "Maps",
			"Nav_People": "People",
			"Nav_Chronology": "Chronology",


			"Goal": "Goal",
			"Subgoal": "Subgoal",
			"ParentGoal": "Parent goal",
			"Title": "Title",
			"Description": "Description",
			"Reference": "Reference",
			
			"Socia_Issue": "Socia:Issue",
			"Socia_Goal": "Socia:Goal",
			
			"StartDate": "Start date",
			"EndDate": "End date",
			"CreatedDate": "Created date",
			"DesiredDate": "DesiredDate",
			"CreatedBy": "Created by",
			"Keyword": "keyword",
			"Status": "Status",
			"Status_NotStarted":"Not started",
			"Status_Aborted": "Aborted",
			"Status_InProgress":"In progress",
			"Status_Completed": "Completed",
			"Status_Unknown": "Unknown",
			"ResultLimit": "Result limit",
			"Subgoals": "SubGoals",
			"Subgoals_HeaderText":"Subgoals of the current goal",
			"Name":"Name",
			"Calendar": "Calendar",
			
			"Act_CreateGoal": "Create new goal",
			"Act_Search": "Search",
			"Act_AddSubgoal": "Add subgoal",
			"Act_listSubgoals": "Subgoals",
			"Act_Register": "Register",
			"Act_SignUp": "Sign up",
			"Act_SignUpSignIn": "Sign in / Sign up",
			"Act_Apply": "Apply",
			"Act_Cancel": "Cancel",
			
			"Err_NoResults": "No results",
			"Err_Error": "Error",
			"Err_ConnectionLost": "The connection has been lost",
			
			"T_MultiSelect_None": "None",
			"T_MultiSelect_All": "All",
			"T_MultiSelect_SelectedText":"# Selected",
			"X_DateFormat": "yyyy-MM-dd",
			"X_DateFormatJQ": "yy-mm-dd",
			"X_FullDateFormat": "yyyy-MM-ddThh:mm:ss",
			
			"Act_GetInfo":"Open info",
			
			"Last": "Last"
		},
	setLanguage: function(lang){
		$.ajax({
			url: "locale-" + lang,
			async: false,
			
		}).done(function(data){ Locale.dict = data; });
		//$.getJSON("locale-" + lang + "", );
	}
};
