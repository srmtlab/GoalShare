/**
 * Basic drawable class
 */

function drawable(x, y, w, h, z){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.z = z;
};
drawable.prototype.setBoard = function(board){
	this.board = board;
}

drawable.prototype.draw = function(canvas){

		// Draw itself
		this.drawSelf(canvas);
		// D
		for(var i= 0; i < this.subElements.length; i++){
			this.subElements[i].draw();
		}
	};
