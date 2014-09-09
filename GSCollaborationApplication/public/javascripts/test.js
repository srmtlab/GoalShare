function runtest(){
	socket.send("fsdfsdfsdfsdfds");
}

var socket = null;

$(document).ready(function(){
	$("#test").click(runtest);
	var wb = new Kinetic.Stage({container: 'container', width: 800, height: 600});
	var layer = new Kinetic.Layer();
	
	var group = new Kinetic.Group({x: 10, y:10,draggable:true});
	
	var rect = new Kinetic.Rect({
		//x: 10,
		//y: 10,
		width: 80,
		height: 80,
		fill: "yellow",
		stroke: "green",
		strokeWidth:4,
		//draggable:true
	});
	
	var c = new Kinetic.Circle({
		//x: 10,
		//y: 10,
		radius:50,
		fill: "red",
		stroke: "black",
		strokeWidth:4,
		//draggable:true
	});
	c.on("click", function(){this.});
	group.on("mouseover", function(){
		console.log(this);
	});
	
	group.add(rect)
	group.add(c);
	layer.add(group);
	wb.add(layer);
	

	
});