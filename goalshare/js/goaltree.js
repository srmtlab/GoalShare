var db;
function goalTree(goalURI, targetElement, width, height, controls, elementClickCallback){
	var treeInst = this;
	this.onGoingQueries = 1;
	this.traversedNodes = new Array();
	// Config options
	this.options = {};
	this.func = {};
	this.options.treeMaxWidth = 600;
	this.options.nodeRadius = 10;
	
	this.options.svgWidth = 800;
	this.options.svgHeight = 500;
	// Controll area
	this.options.controlWidth = 40;
	this.options.treeWidth = 400;//this.options.svgWidth*0.9;
	this.options.treeHeigth = 600;//this.options.svgHeigth*0.9;
	
	this.options.textEvenHop = 13;
	this.options.maxTextWidth = 10;
	this.options.padding = 3;
	this.options.treePadding = 25;
	this.options.makeControls = controls?true:false;
	
	this.options.zoomStep = 0.15;
	
	if( elementClickCallback )
		this.func.elementClick = elementClickCallback;
	this.func.targetSelector = targetElement;
	this.setDimensions(width, height);
	this.func.startX = null;
	this.func.startY = null;
	//console.log("goaltree "+goalURI)
	this.func.origGoalURI = goalURI;
	this.graph = {};
	this.graph.currentZoomLevel = 1;
	$.getJSON("/api/get_goaltree.pl", {goalURI: goalURI},
			function(data){
				treeInst.root = data;
				treeInst.traversedNodes.push(goalURI);
				treeInst.getChildren(treeInst.root, 1);
				treeInst.root.level = 0;
				treeInst.func.treeDepth = 1;
				treeInst.onGoingQueries -= 1;
			});
};
var l;
var te;
/*
 * Controls
 */
goalTree.prototype.createControls = function(){
	var instance = this;
	$(this.graph.selector).loadTemplate("templates/goalTreeControl_template.html", {}, {
		file : true,
		prepend: true,
		beforeInsert: function(element){
			// Populate and init goalFinder
			var goalSelect = $(element).find(".goalSelect");
			te=element;
			for ( var i = 0; i < instance.graph.nodes.length; i++ ){
				goalSelect.append("<option value=\"" + instance.graph.nodes[i].goalURI + "\">" + instance.graph.nodes[i].title + "</option>")
			}
			
			goalSelect.multiselect({ multiple:false,
								selectedText: Locale.dict.Act_FocusOnGoal })
						.on("multiselectclick", function(event, ui){
							instance.focusOnGoal(ui.value);
						});
			
			// Search open button
			var topWrapperId = guid();
			$(element[2]).attr("id", topWrapperId);
			$(element).find("div.controlButton.search").click(function(){
					$("#" + topWrapperId).slideToggle();
				});
			
			// Zoom in button
			$(element).find("div.controlButton.zoomIn").click(function(){
				//instance.graph.currentZoomLevel = instance.graph.currentZoomLevel + instance.options.zoomStep
				instance.setZoom( instance.graph.currentZoomLevel + instance.options.zoomStep );
			});
			
			// ResetZoom button
			$(element).find("div.controlButton.zoomReset").click(function(){
				instance.resetZoom();
			});
			
			// Zoom out button
			$(element).find("div.controlButton.zoomOut").click(function(){
				instance.setZoom( instance.graph.currentZoomLevel - instance.options.zoomStep );
			});
			
			// Reset pan
			$(element).find("div.controlButton.panReset").click(function(){
				instance.resetPan();
			});
			
			// Close
			$(element).find("div.controlButton.close").click(function(){
				$(instance.func.targetSelector).slideUp(function(){$(this).children().remove();});
			});
			
			// Help icon
			$(element).find("div.controlButton.help").qtip(
					{
						content : {
							text : Locale.dict.GoalTree_Instructions
						},
						style : {
							classes : 'qtip-youtube qtip-shadow'
						}
					});
		}
	});
	

};
// Count siblings for each level of the tree
goalTree.prototype.calculateSiblings = function(currentNode){
	if( !currentNode || !currentNode.children )
		return false;
	if ( !currentNode.nthSibling ){
		currentNode.nthSibling = 0;
	}
	for( var i = 0; i < currentNode.children.length; i++ ){
		currentNode.children[i].nthSibling = i;
		this.calculateSiblings(currentNode.children[i]);
	}	
};
// Sets dimensions and handles dynamic options
goalTree.prototype.setDimensions = function(w, h){
	this.options.svgWidth = w;
	this.options.svgHeight = h;
	this.options.treeWidth = w - this.options.padding*2;
	this.options.treeHeigth = h - this.options.padding*2;
};

// Recursive subgoal fetch
goalTree.prototype.getChildren = function(goal, level){
	var inst = this;
	inst.onGoingQueries += 1;
	var currentGoal = goal;
	if( level > 100 )
		return;
	
	$.getJSON("/api/query_subgoals.pl", {goalUrl: currentGoal.goalURI},
			function(data){
				currentGoal.subgoals = data.subgoals;	
				if(currentGoal.subgoals.length > inst.treeMaxWidth )
					inst.treeMaxWidth = currentGoal.subgoals.length;
				for(var i = 0; i < currentGoal.subgoals.length; i++){
					//var currentSubgoal = currentGoal.subgoals[i];
					currentGoal.subgoals[i].nthSibling = i;
					if( $.inArray(currentGoal.subgoals[i].goalURI, inst.traversedNodes ) > 0 ){
						// Encountered already traversed node -> loop found 
//						console.log("Tree found a loop: [" + currentGoal.goalURI + "] to [" + currentGoal.subgoals[i].goalURI + "]");
//						console.log(inst.root);
//						console.log(currentGoal);
//						$.each(inst.traversedNodes, function(i, val){console.log(i + "[" + val + "]" );});
						//throw "loop found!";
					}
					currentGoal.subgoals[i].level = level;
					if(inst.func.treeDepth < level)
						inst.func.treeDepth = level;
					inst.traversedNodes.push(currentGoal.subgoals[i].goalURI);
					inst.getChildren(currentGoal.subgoals[i], level + 1);
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
	this.calculateSiblings( this.root );
	inst.options.treeHeigth = 100 + 50 * inst.func.treeDepth;
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

	console.log(inst.graph.selector);
	// Create the svg
	inst.graph.svg = d3.select(inst.graph.selector).append("svg")
		.attr("class", "goalTree")
		.attr("width", this.options.svgWidth)
		.attr("height", this.options.svgHeight);
	
	inst.func.containerX = inst.options.padding;
	inst.func.containerY = inst.options.padding;

	// Zoom behavior
	var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on("zoom", function(){
    	d3.select(this).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    	inst.graph.currentZoomLevel = d3.event.scale;
    });
	
	// Drag behavior
	var drag1 = d3.behavior.drag()
		 .origin(function() { 
	        var t = d3.select(this);	        
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
						return d.y + inst.options.treePadding;
					});
				
	
	this.graph.nodeGroup = this.graph.container.selectAll("g.node")
		.data(this.graph.nodes)
		.enter()
		.append("svg:g")
		.attr("class", "node")
		.attr("data-goaluri", function(d){return d.goalURI;})
		.attr("transform", function(d){
			return "translate(" + d.x + "," + (d.y + inst.options.treePadding) + ")";}
		);
	
	
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
    	if( d.nthSibling % 2 == 0){
    		gap = gap + inst.options.textEvenHop;
    	}
        return (d.children ? -gap : gap) ;
    })
    //.attr("dx", 3)
    .text(function(d)
    {
    	return shortenText(d.title, 10);
        //return d.title;
    });
	this.graph.nodeGroup.append("circle")
	.attr("class","node-dot")
	.attr("class", function(d){
		if(d.url == inst.func.origGoalURI)
			return "node-dot " + d.status + " Original";
		return "node-dot " + d.status;
		}
	)
	.attr("title", function(d){
		return d.title;
		}
	)
	.attr("data-goal-title", function(d){
		return d.title;
	})
	.attr("data-goaluri", function(d){return d.goalURI;})
	.attr("data-description", function(d){return d.description; })
	.attr("data-gs-linkuri", function(d){return window.location.origin + window.location.pathname + "?showGoal=" + d.goalURI; })
	.attr("r", this.options.nodeRadius)
	.on("click", function(d){
			//OpenInNewTab
		OpenInNewTab( getGSGoalLink(d.goalURI) )
		//console.log( getGSGoalLink(d.goalURI) );
			
		});
	
	$("circle.node-dot").each(function(index, val){
		var title = $(val).data("goal-title")?$(val).data("goal-title"):"";
		var description = $(val).data("description")?$(val).data("description"):"";
		var content = "<div>" + title + "<br /><br />" + description + "</div>";
		
		$(val).qtip({ content : {
			text : content
			},
			style : {
				classes : 'qtip-youtube qtip-shadow'
			} 
		});
		
		// Assign callback
		if ( inst.func.elementClick ){
			$(val).click(function(d){
					inst.func.elementClick(d, $(val).data("goaluri"));
			});
		}
	});
	this.createControls();
//	$(this.graph.selector).loadTemplate("templates/goalTreeControl_template.html", {
//		file : true,
//		prepend: true,
//	});
	$(this.graph.selector).show();
	this.setZoom(0.8);
	this.setPos(10,20);
	
};


/*
 * Zooming and panning commands
 */
goalTree.prototype.resetZoom = function(){
	this.setZoom(1);
	this.graph.currentZoomLevel = 1;
};
goalTree.prototype.resetPan = function(){
	this.setPos(0,0);
};

goalTree.prototype.setZoom = function(level){
	this.graph.zoomContainer.attr("transform", "translate(0)scale(" + level + ")");
	this.graph.currentZoomLevel = level;
};
goalTree.prototype.setPos = function(x,y){
	console.log("x["+x+"] y["+y+"]");
	this.graph.container.attr("transform", "translate(" + x + ", " + y + ")");
};

/*
 * Goal related positioning
 */
goalTree.prototype.focusOnGoal_disabled = function(goalURI){
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



goalTree.prototype.focusOnGoal = function(goalURI){
	var goal = this.fetchGoal1(goalURI);
	if ( goal == null )
		return;
	//console.log(goal);
	this.resetZoom();
	this.resetPan();
	var x = goal.getCTM().e;
	var y = goal.getCTM().f;
	this.setPos( ( this.options.treeWidth / 2 ) - x,  ( this.options.treeHeigth / 2 ) - y );
	//this.setPos( ( this.options.treeWidth / 2 ) - goal.x,  ( this.options.treeHeigth / 2 ) - goal.y );
};
goalTree.prototype.fetchGoal1 = function(goalURI){
	for ( var i = 0; i < this.graph.nodeGroup[0].length; i++){
		//console.log( $( this.graph.nodeGroup[0][i] ).data("goaluri"));
		if ( $( this.graph.nodeGroup[0][i] ).data("goaluri") == goalURI )
			return this.graph.nodeGroup[0][i];
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


//var deb = new goalTree('http://collab.open-opinion.org/resource/Goal/5fbc54c1-a8af-d568-b85f-a92107f0fcd0', "#tree1holder",300,400);