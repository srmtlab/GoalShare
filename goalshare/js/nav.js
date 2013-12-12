

$(function() {
    $(".nav li").click(function() {
        var num = $(".nav li").index(this);
        $(".nav li").removeClass('selected');
	var dataClass = $(this).attr("class");
        $(this).addClass('selected');
	$(".visualizer").css("display", "none");
	$(".visualizer#"+dataClass).css("display", "block");
    });
    //$("div.header").append("<span>"+location.hash+"</span>");
    if (location.hash == "#issue") {
	$("li.issue").click();
    } else if (location.hash == "#goal") {
	$("li.goal").click();
    } else if (location.hash == "#point") {
	$("li.point").click();
    } else if (location.hash == "#agent") {
	$("li.agent").click();
    } else if (location.hash == "#date") {
	$("li.date").click();
    } else  if (location.hash == "#goaltree") {
	$("li.goaltree").click();
    }else{
	$("li.goal").click();
    }

    //$("div.resource").collapse();

});

