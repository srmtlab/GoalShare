function goalTree(goalUri){
	var treeInst = this;
	$.getJSON("/api/goaltree.pl", {goalURI: goalURI},
			function(data){
				treeInst.root = data;
				treeInst.getChildren(treeInst.root);
			});
};


goalTree.prototype.getChildren(goal){
	var currentGoal = goal;
	$.getJSON("/api/query_subgoals.pl", {goalUrl: goalURI},
			function(data){
			currentGoal['subgoals'] = data.subgoals;	
				treeInst.root = data;
				for(var i = 0; i < currentGoal.subgoals.length; i++){
					
				}
				
			});
};