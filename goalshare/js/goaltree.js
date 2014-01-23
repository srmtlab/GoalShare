function goalTree(goalURI, targetElement, width, height, controls){
	var treeInst = this;
	this.onGoingQueries = 1;
	this.traversedNodes = new Array();
	// Config options
	this.options = {};
	this.func = {};
	this.options.treeMaxWidth = 600;
	this.options.nodeRadius = 5;
	this.options.svgWidth = 800;
	this.options.svgHeight = 500;
	this.options.treeWidth = 400;//this.options.svgWidth*0.9;
	this.options.treeHeigth = 600;//this.options.svgHeigth*0.9;
	this.options.maxTextWidth = 10;
	this.options.padding = 3;
	this.options.treePadding = 25;
	this.options.makeControls = controls?true:false;
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
				treeInst.traversedNodes.push(goalURI);
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
					if( $.inArray(currentGoal.subgoals[i].goalURI, inst.traversedNodes ) > 0 ){
						// Encountered a traversed node -> loop found 
						console.log("Tree found a loop: [" + currentGoal.goalURI + "] to [" + currentGoal.subgoals[i].goalURI + "]");
						$.each(inst.traversedNodes, function(i, val){console.log(i + "[" + val + "]" );});
						throw "loop found!";
					}
					inst.traversedNodes.push(currentGoal.subgoals[i].goalURI);
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
//	$(this.graph.selector).append( $("<div />").addClass("goalTreeContols")
//									    .append( $("<button />").addClass("pagerButton pagerPrev ui-button ui-button-small")
//									    		)
//								);
	
	// Create the svg
	inst.graph.svg = d3.select(inst.graph.selector).append("svg")
		.attr("width", this.options.svgWidth)
		.attr("height", this.options.svgHeight);
		//.on("mousedown", function(d, i){	inst.mousedown(d,i,inst, this);});
	//this.render();
	inst.func.containerX = inst.options.padding;
	inst.func.containerY = inst.options.padding;

	// Zoom behaviour
	var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", function(){
    	console.log("zoom");
    	d3.select(this).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

    });
	
	// Drag behaviour
	var drag1 = d3.behavior.drag()
		 .origin(function() { 
	        var t = d3.select(this);
	        //console.log(t);	        
	        return {x: t.attr("x") + d3.transform(t.attr("transform")).translate[0],
                y: t.attr("y") + d3.transform(t.attr("transform")).translate[1]};
	    })
	    .on("dragstart", function(d){d3.event.sourceEvent.stopPropagation();})
	    .on("drag", function(d,i) {
	        d3.select(this).attr("transform", function(d,i){       	
	            return "translate(" + [ d3.event.x,d3.event.y ] + ")";
	        });
	    });
	
	// Container for the tree
	this.graph.zoomContainer = this.graph.svg
	.append("g")
	.call(zoom);
	
	this.graph.container = this.graph.zoomContainer
	.append("g")
	.attr("class", "container")
	.attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
	
	this.graph.container.append("rect")
				.attr({"width":inst.options.treeWidth,"height":inst.options.treeHeigth+inst.options.treePadding})
				.style("opacity", 0.0);
	//.on("mousedown", clicked);
	
	this.graph.container
			.call(drag1);
	
	
	
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
    	return shortenText(d.title, 13);
        //return d.title;
    });
	$(this.graph.selector).show();
	
};

/*
 * Zooming and panning commands
 */
goalTree.prototype.resetZoom = function(){
	this.setZoom(1);
};
goalTree.prototype.resetPan = function(){
	this.setPos(0,0);
};

goalTree.prototype.setZoom = function(level){
	this.graph.zoomContainer.attr("transform", "translate(0)scale(" + level + ")");
};
goalTree.prototype.setPos = function(x,y){
	this.graph.container.attr("transform", "translate(" + x + ", " + y + ")");
};

/*
 * Goal related positioning
 */
goalTree.prototype.focusOnGoal = function(goalURI){
	var goal = this.fetchGoal(goalURI);
	if ( goal == null )
		return;
	this.setPos( ( this.options.treeWidth / 2 ) - goal.x,  ( this.options.treeHeigth / 2 ) - goal.y );
};
goalTree.prototype.fetchGoal = function(goalURI){
	for ( var i = 0; i < this.graph.nodes.length; i++){
		if ( this.graph.nodes[i].goalURI == goalURI )
			return this.graph.nodes[i];
	}
	return null;
};




















function clicked(d) {
	console.log("d" + d );
}



//// Panning function
//goalTree.prototype.mousedown = function(d, i, inst, svg) {
//    var m = d3.mouse(svg);
//    console.log("down");
////    line = vis.append("line")
////        .attr("x1", m[0])
////        .attr("y1", m[1])
////        .attr("x2", m[0])
////        .attr("y2", m[1]);
//    inst.func.startX = m[0];
//    inst.func.startY = m[1];
////    inst.graph.svg.on("mouseup", mouseup);
////    inst.graph.svg.on("mousemove", mousemove);
//    inst.graph.svg.on("mouseup", function(d, i){inst.mouseup(d,i,inst, this);});
//	inst.graph.svg.on("mousemove", function(d, i){inst.mousemove(d,i,inst, this);});
//};
//
//goalTree.prototype.mousemove = function(d, i, inst, svg) {
//    console.log(d);
//    if(inst.func.startX){
//		var m = d3.mouse(svg);
//	    var dx = m[0] - inst.func.startX;
//	    var dy = m[1] - inst.func.startY;
//	    inst.func.startX = m[0];
//	    inst.func.startY = m[1];
//	    inst.func.containerX += dx;
//	    inst.func.containerY += dy;
//	    //console.log("startX: " + inst.func.startX + " startY" + inst.func.startY + " curX: " + m[0] + " curY: " + m[1] + " dx: " + dx + " dy; " + dy);
//	    inst.graph.container.transition().attr("transform", "translate(" + inst.func.containerX + "," + inst.func.containerY + ")");
//    }
// };
//
//goalTree.prototype.mouseup = function(d, i, inst, svg) {
//	console.log("up");
//	inst.graph.svg.on("mousemove", null);
//    inst.func.startX = null;
//    inst.func.startY = null;
//    inst.graph.svg.on("mouseup", null);
//	inst.graph.svg.on("mousemove", null);
//};
// http://collab.open-opinion.org/resource/Goal/f107dbf6-aa58-7b26-4cc2-a228c556c56b
//http://collab.open-opinion.org/resource/Goal/5fbc54c1-a8af-d568-b85f-a92107f0fcd0
//http://collab.open-opinion.org/resource/Goal/8f48ed37-4369-40de-349f-f7a68dfbfecd
var deb = new goalTree('http://collab.open-opinion.org/resource/Goal/5fbc54c1-a8af-d568-b85f-a92107f0fcd0', "#tree1holder",300,400);