/*
 * Init goal tree controls
 */
var goalTreeSite = {
	autoComplete: null,
};
goalTreeSite.goaltrees = new Array();

$(function(){
	// Init search
	$.getJSON("/api/autocomplete.pl", {
		type : "goals"
	}, function(data) {
		goalTreeSite.autoComplete = data.goals;
		$("#goalTreeSearch").autocomplete(
				{
					source : goalTreeSite.autoComplete,
					select : function(event, ui) {
						this.value = ui.item.label;
						$('#goalTreeSearch').val(
								ui.item.label);
						$('#goalTreeSearchValue').val(
								ui.item.value);
						return false;
					},
					change: function(event, ui) {
						
						$('#goalTreeSearchValue').val(ui.item ? ui.item.value : "");
			        }
				});
	});
	
	// Handle append click
	$("#goalTreeAppendSubmit").click(function(){
		var goalURI = $('#goalTreeSearchValue').val();
		if( !goalURI || goalURI == "" )
			return false;
		var id = guid();
		var div = $("<div />").addClass("goaltreeHolder")
							.attr("id", id);
		
		$("#treeHolderArea").append(div);
		goalTreeSite.goaltrees.push( new goalTree(goalURI, "#"+id,300,400) ); 
		$('#goalTreeSearch').val("");
		$('#goalTreeSearchValue').val("");
	});
});