/**
 * Elements 
 */

function element(board, x, y){
	this.x = x;
	this.y = y;
	this.board=board;
	this.subElements = new Array();
	this.state = { 
			clickable: false,
			hoverable: false,
			dragable: false,
			
			dragged: false, 
			mouseOver: false,
			mouseDown: false
			
	};
	this.callbacks = {
		mouseOver: new Array(),
		mouseOff: new Array(),
		mouseClick: new Array()
	};
};

element.prototype.addSubElement = function(element){
	this.subElements.push(element);
};

// Boundaries
element.prototype.getBoundaries = function(){
	return { x1: this.x, y1: this.y, x2: this.x + this.w, y2: this.y + this.h }; 
};

element.prottotype.testBoundaries = function(x, y){
	if( this.x >= x && this.x + w <= x && this.y >= y && this.y + this.h <= y )
		return true;
	else 
		return false;
}


// Mouse handling
element.prototype.mouseOver(event, hidden = false){
	
	this.state.mouseOver = true;
	this.mouseHooverStatTime = new Date();
	var ret = false;
	for(var i = 0; i < this.subElements.length; i++){
		if( this.subElement.testBoundaries(x,y) ){
			ret = this.subElement[i].mouseOver(mX, mY, ret);
		}
	}
	return this.selfMouseOver(mX, mY, ret);
}

element.prototype.mouseDown = function(){
	var ret = false;
	for(var i = 0; i < this.subElements.length; i++){
		if( this.subElements[i].state.clickable && this.subElements[i].testBoundaries(x,y) ){
			ret = this.subElement[i].mouseOver(mX, mY, ret);
			// Down is handled
			if( ret )
				return false;
		}
	}
	this.selfMouseDown(mX, mY, ret);
}
element.prototype.mouseUp = function(){
	
}

element.prototype.mouseOff(mX, mY){
	
}



