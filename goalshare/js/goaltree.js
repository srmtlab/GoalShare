function goalTree(goalURI){
	var treeInst = this;
	this.onGoingQueries = 1;
	// Config options
	this.options = {};
	this.options.treeMaxWidth = 600;
	this.options.nodeRadius = 5;
	this.options.svgWidth = 800;
	this.options.svgHeigth = 500;
	this.options.treeWidth = 400;//this.options.svgWidth*0.9;
	this.options.treeHeigth = 600;//this.options.svgHeigth*0.9;
	this.options.maxTextWidth = 40;
	this.options.padding = 10;
	
	this.func = {};
	
	this.graph = {};
	$.getJSON("/api/get_goaltree.pl", {goalURI: goalURI},
			function(data){
				treeInst.root = data;
				treeInst.getChildren(treeInst.root);
				treeInst.onGoingQueries -= 1;
			});
};
var l;
// Sets dimensions and handles dynamic options
goalTree.prototype.setDimensions = function(w, h){
	this.options.svgWidth = w;
	this.options.svgHeigth = h;
	this.options.treeWidth = w - this.options.padding*2;
	this.options.treeHeigth = h - this.options.padding*2;
};
// Recursive subgoal fetch
goalTree.prototype.getChildren = function(goal){
	var inst = this;
	inst.onGoingQueries += 1;
	var currentGoal = goal;
	
	$.getJSON("/api/query_subgoals.pl", {goalUrl: currentGoal.goalURI},
			function(data){
				currentGoal.subgoals = data.subgoals;	
				if(currentGoal.subgoals.length > inst.treeMaxWidth )
					inst.treeMaxWidth = currentGoal.subgoals.length;
				for(var i = 0; i < currentGoal.subgoals.length; i++){
					//var currentSubgoal = currentGoal.subgoals[i];
					inst.getChildren(currentGoal.subgoals[i]);
				}
				inst.onGoingQueries -= 1;
				
			});
};
// Append Construct elements,...
goalTree.prototype.display = function(selector, width, heigth){
	var inst = this;
	
	this.graph.selector = selector;
	inst.setDimensions(width, heigth);
	
	// Build the tree from data
	var tree = d3.layout.tree()
					.sort(null)
					.size([inst.options.treeWidth - inst.options.padding*2, inst.options.treeHeigth - inst.options.padding * 2 ])
					.children(function(d){
						return ( !d.subgoals && d.subgoals.length == 0)? null:d.subgoals;
					});
	
	this.graph.nodes = tree.nodes(this.root);
	this.graph.links = tree.links(this.graph.nodes);
	$(this.graph.selector).children().remove();
	// Create the svg
	inst.graph.svg = d3.select(inst.graph.selector).append("svg")
		.attr("width", this.options.svgWidth)
		.attr("height", this.options.svgHeight)
		.on("mousedown", function(d, i){inst.mousedown(d,i,inst);})
		.on("mouseup", function(d, i){inst.mouseup(d,i,inst);})
		.on("mousemove", function(d, i){inst.mousemove(d,i,inst);});
	this.render();
};
// Draw the tree elements
goalTree.prototype.render = function(){
	var inst = this;
	inst.func.containerX = inst.options.padding;
	inst.func.containerY = inst.options.padding;
	// Container for the tree
	this.graph.container = this.graph.svg
	.append("g")
	.attr("class", "container")
	.attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
	
	var link = d3.svg.diagonal();
	
	this.graph.linkSet = this.graph.container.selectAll("path.link")
				.data(this.graph.links)
				.enter()
				.append("svg:path")
				.attr("class", "link")
				.attr("d",link);
	
	this.graph.nodeGroup = this.graph.container.selectAll("g.node")
		.data(this.graph.nodes)
		.enter()
		.append("svg:g")
		.attr("class", "node")
		.attr("transform", function(d){
			return "translate(" + d.x + "," + d.y + ")";}
		);
	this.graph.nodeGroup.append("circle")
	.attr("class","node-dot")
	.attr("r", this.options.nodeRadius)
	.on("click", clicked);
	
	this.graph.nodeGroup.append("svg:text")
    .attr("text-anchor", function(d)
    {
    	return "middle";
        return d.children ? "end" : "start";
    })
    .attr("dy", function(d)
    {
        var gap = 2 * inst.options.nodeRadius + 5;
        return d.children ? -gap : gap;
    })
    //.attr("dx", 3)
    .text(function(d)
    {
        return d.title;
    });
	
};

function clicked(d) {
	// Transition
	console.log(d);
//	return;
//	 container.transition()
//	 			.delay(200)
//	 			.attr("transform", "translate("+d.x+","+d.y+")");
//	 
//	  if (!d || centered === d) {
//		  
//	    projection.translate([width / 2, height / 2]);
//	    centered = null;
//	  } else {
//	    var centroid = path.centroid(d),
//	        translate = projection.translate();
//	    projection.translate([
//	      translate[0] - centroid[0] + width / 2,
//	      translate[1] - centroid[1] + height / 2
//	    ]);
//	    centered = d;
//	  }
//
//	  // Transition to the new projection.
//	  g.selectAll("path").transition()
//	      .duration(750)
//	      .attr("d", path);
}

// Panning function
goalTree.prototype.mousedown = function(d, i, inst) {
    var m = d3.mouse(d);
    console.log("down");
//    line = vis.append("line")
//        .attr("x1", m[0])
//        .attr("y1", m[1])
//        .attr("x2", m[0])
//        .attr("y2", m[1]);
    startX = m[0];
    var startY = m[1];
    inst.graph.svg.on("mouseup", mouseup);
    inst.graph.svg.on("mousemove", mousemove);
};

goalTree.prototype.mousemove = function(d, i, inst) {
    var m = d3.mouse(this);
    var dx = m[0] - startX;
    var dy = m[0] - startY;
    inst.func.containerX += dx;
    inst.func.containerY += dy;
    inst.graph.container.transition().attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
};

goalTree.prototype.mouseup = function(d, i, inst) {
	console.log("up");
	vis.on("mousemove", null);
    inst.func.startX = null;
    inst.func.startY = null;
};

var deb = new goalTree('http://collab.open-opinion.org/resource/Goal/f107dbf6-aa58-7b26-4cc2-a228c556c56b');