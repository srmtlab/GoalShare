function goalTree(goalURI){
	var treeInst = this;
	this.onGoingQueries = 1;
	this.options = {};
	this.options.treeMaxWidth = 600;
	this.options.nodeRadius = 5;
	this.options.svgWidth = 800;
	this.options.svgHeigth = 500;
	this.options.treeWidth = 400;//this.options.svgWidth*0.9;
	this.options.treeHeigth = 600;//this.options.svgHeigth*0.9;
	this.options.maxTextWidth = 40;
	this.options.padding = 10;
	
	this.graph = {};
	$.getJSON("/api/get_goaltree.pl", {goalURI: goalURI},
			function(data){
				treeInst.root = data;
				treeInst.getChildren(treeInst.root);
				treeInst.onGoingQueries -= 1;
			});
};
var l;

goalTree.prototype.setDimensions = function(w, h){
	this.options.svgWidth = w;
	this.options.svgHeigth = h;
	this.options.treeWidth = w - this.options.padding*2;
	this.options.treeHeigth = h - this.options.padding*2;
	
};

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

var nod;
var lnk;
goalTree.prototype.display = function(selector, width, heigth){
	
	data = [1,2,3,4];
	var inst = this;
	this.graph.selector = selector;
	inst.setDimensions(width, heigth);
	// Clear old
	
	// Build the tree
	var tree = d3.layout.tree()
					.sort(null)
					.size([inst.options.treeWidth - inst.options.padding*2, inst.options.treeHeigth - inst.options.padding * 2 ])
					.children(function(d){
						return ( !d.subgoals && d.subgoals.length == 0)? null:d.subgoals;
					});
	
	this.graph.nodes = tree.nodes(this.root);
	this.graph.links = tree.links(this.graph.nodes);
	this.render();
};
goalTree.prototype.render = function(){
	var inst = this;
	
	// Create projection
	$(this.graph.selector).children().remove();
	// Create the svg
	this.graph.svg = d3.select(inst.graph.selector).append("svg:svg")
	.attr("width", this.options.svgWidth)
	.attr("height", this.options.svgHeight);
	
	// Container for the tree
	this.graph.container = this.graph.svg
	.append("svg:g")
	.attr("class", "container")
	.attr("transform", "translate(" + inst.options.padding + "," + inst.options.padding + ")");
	
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
	.attr("r", this.options.nodeRadius);
	
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
	  
	  if (!d || centered === d) {
	    projection.translate([width / 2, height / 2]);
	    centered = null;
	  } else {
	    var centroid = path.centroid(d),
	        translate = projection.translate();
	    projection.translate([
	      translate[0] - centroid[0] + width / 2,
	      translate[1] - centroid[1] + height / 2
	    ]);
	    centered = d;
	  }

	  // Transition to the new projection.
	  g.selectAll("path").transition()
	      .duration(750)
	      .attr("d", path);
	}


var deb = new goalTree('http://collab.open-opinion.org/resource/Goal/f107dbf6-aa58-7b26-4cc2-a228c556c56b');