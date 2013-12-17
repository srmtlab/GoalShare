function goalTree(goalURI, targetElement, width, height){
	var treeInst = this;
	return;
	this.onGoingQueries = 1;
	// Config options
	this.options = {};
	this.func = {};
	this.options.treeMaxWidth = 600;
	this.options.nodeRadius = 5;
	this.options.svgWidth = 800;
	this.options.svgHeight = 500;
	this.options.treeWidth = 400;//this.options.svgWidth*0.9;
	this.options.treeHeigth = 600;//this.options.svgHeigth*0.9;
	this.options.maxTextWidth = 40;
	this.options.padding = 3;
	this.options.treePadding = 25;
	this.func.targetSelector = targetElement;
	this.setDimensions(width, height);
	this.func.startX = null;
	this.func.startY = null;
	//console.log("goaltree "+goalURI)
	this.func.origGoalURI = goalURI;
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
	this.options.svgHeight = h;
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
				if( inst.onGoingQueries == 0 )
					inst.display(inst.func.targetSelector, inst.options.svgWidth, inst.options.svgHeight);
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
		.attr("height", this.options.svgHeight);
		//.on("mousedown", function(d, i){	inst.mousedown(d,i,inst, this);});
	//this.render();
	inst.func.containerX = inst.options.padding;
	inst.func.containerY = inst.options.padding;

	var drag1 = d3.behavior.drag()
		 .origin(function() { 
	        var t = d3.select(this);
	        //console.log(t);
	        return {x: t.attr("x") + d3.transform(t.attr("transform")).translate[0],
                y: t.attr("y") + d3.transform(t.attr("transform")).translate[1]};
	    })
	    .on("drag", function(d,i) {
	        d3.select(this).attr("transform", function(d,i){       	
	            return "translate(" + [ d3.event.x,d3.event.y ] + ")";
	        });
	    });

	// Container for the tree
	this.graph.container = this.graph.svg
	.append("g")
	.attr("class", "container")
	.attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
	
	this.graph.container.append("rect")
				.attr({"width":inst.options.treeWidth,"height":inst.options.treeHeigth+inst.options.treePadding})
				.style("opacity", 0.0);
	//.on("mousedown", clicked);
	
	this.graph.container.call(drag1);
	
	
	
	var link = d3.svg.diagonal()
				.projection(function(d){
					return [d.x, d.y+inst.options.treePadding];
				});
	
	this.graph.linkSet = this.graph.container.selectAll("path.link")
				.data(this.graph.links)
				.enter()
				.append("svg:path")
				.attr("class", "link")
				.attr("d",link)
				.attr("y", function(d){
					//console.log(d);
					//console.log(inst.options.treePadding);
					return d.y + inst.options.treePadding;});
				
	
	this.graph.nodeGroup = this.graph.container.selectAll("g.node")
		.data(this.graph.nodes)
		.enter()
		.append("svg:g")
		.attr("class", "node")
		.attr("transform", function(d){
			return "translate(" + d.x + "," + (d.y + inst.options.treePadding) + ")";}
		);
	this.graph.nodeGroup.append("circle")
	.attr("class","node-dot")
	.attr("class", function(d){
		if(d.url == inst.func.origGoalURI)
			return "node-dot " + d.status + " Original";
		return "node-dot " + d.status;
		console.log(d.status);
		}
	)
	.attr("r", this.options.nodeRadius)
	.on("click", clicked);
	
	this.graph.nodeGroup.append("rect")
			.style("fill", "white")
			.attr("width", 40)
			.attr("height", 30)
			.style("stroke", d3.scale.category20c())
			.style("opacity", 0.0)
			.attr("html", function(d){return d.description;});
	
	this.graph.nodeGroup.append("svg:text")
    .attr("text-anchor", function(d)
    {
    	return "middle";
        return d.children ? "end" : "start";
    })
    .attr("dy", function(d)
    {
        var gap = 2 * inst.options.nodeRadius + 5 ;
        return (d.children ? -gap : gap) ;
    })
    //.attr("dx", 3)
    .text(function(d)
    {
        return d.title;
    });
	$(this.graph.selector).show();
	
};

function clicked(d) {
	console.log("d" + d );
}

// Panning function
goalTree.prototype.mousedown = function(d, i, inst, svg) {
    var m = d3.mouse(svg);
    console.log("down");
//    line = vis.append("line")
//        .attr("x1", m[0])
//        .attr("y1", m[1])
//        .attr("x2", m[0])
//        .attr("y2", m[1]);
    inst.func.startX = m[0];
    inst.func.startY = m[1];
//    inst.graph.svg.on("mouseup", mouseup);
//    inst.graph.svg.on("mousemove", mousemove);
    inst.graph.svg.on("mouseup", function(d, i){inst.mouseup(d,i,inst, this);});
	inst.graph.svg.on("mousemove", function(d, i){inst.mousemove(d,i,inst, this);});
};

goalTree.prototype.mousemove = function(d, i, inst, svg) {
    console.log(d);
    if(inst.func.startX){
		var m = d3.mouse(svg);
	    var dx = m[0] - inst.func.startX;
	    var dy = m[1] - inst.func.startY;
	    inst.func.startX = m[0];
	    inst.func.startY = m[1];
	    inst.func.containerX += dx;
	    inst.func.containerY += dy;
	    //console.log("startX: " + inst.func.startX + " startY" + inst.func.startY + " curX: " + m[0] + " curY: " + m[1] + " dx: " + dx + " dy; " + dy);
	    inst.graph.container.transition().attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
    }
 };

goalTree.prototype.mouseup = function(d, i, inst, svg) {
	console.log("up");
	inst.graph.svg.on("mousemove", null);
    inst.func.startX = null;
    inst.func.startY = null;
    inst.graph.svg.on("mouseup", null);
	inst.graph.svg.on("mousemove", null);
};

//var deb = new goalTree('http://collab.open-opinion.org/resource/Goal/f107dbf6-aa58-7b26-4cc2-a228c556c56b', "#tree1holder",300,400);