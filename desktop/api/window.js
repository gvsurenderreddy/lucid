dojo.require("dojox.layout.ResizeHandle");
dojo.require("dojo.dnd.move");
dojo.require("dijit.layout._LayoutWidget");
dojo.require("dojox.fx.easing");
dojo.require("dijit._Templated");
/*
 * Class: api.window
 * 
 * Summary:
 * 		The window constructor
 * 
 * Example:
 * 		(start code)
 * 		win = new api.window();
 * 		win.title = "foo";
 * 		win.height =  "200px";
 * 		win.width = "20%";
 * 		widget = new dijit.layout.ContentPane();
 * 		widget.setContent("baz");
 * 		win.addChild(widget);
 * 		win.show();
 * 		win.startup();
 * 		setTimeout(dojo.hitch(win, win.destroy), 1000*5);
 * 		(end code)
 */
dojo.declare("api.window", [dijit.layout._LayoutWidget, dijit._Templated], {
	templateString: "<div class=\"win\" style=\"display: none;\" dojoattachevent=\"onmousedown: bringToFront\"><div class=\"win-tl\"><div class=\"win-tr\"><div class=\"win-tc\" dojoattachevent=\"onmousedown: bringToFront\"><div dojoattachpoint=\"titleNode,handle\" class=\"win-title\">${title}</div><div class=\"win-buttons\"><div dojoattachevent=\"onmouseup: close\" class=\"win-close\"></div><div dojoattachevent=\"onmouseup: _toggleMaximize\" class=\"win-max\"></div><div dojoattachevent=\"onmouseup: minimize\" class=\"win-min\"></div></div></div></div></div><div class=\"win-bmw\"><div class=\"win-ml\"><div class=\"win-mr\"><div class=\"win-mc\" style=\"overflow: hidden;\" dojoattachpoint=\"containerNode\"></div></div></div><div class=\"win-bl\"><div class=\"win-br\"><div class=\"win-bc\"></div></div></div><div dojoattachpoint=\"sizeHandle\" class=\"win-resize\"></div></div></div>",
	/*
	 * Property: closed
	 * 
	 * Summary:
	 * 		Is the window closed?
	 */
	closed: false,
	/*
	 * Property: onClose
	 * 
	 * Summary:
	 * 		What to do on destroying of the window
	 */
	onClose: function() {
		
	},
	/*
	 * Property: onResize
	 * 
	 * Summary:
	 * 		What to do on the resizing of the window
	 */
	onResize: function() {
		
	},
	/*
	 * Property: onMinimize
	 * 
	 * Summary:
	 * 		What to do on the minimizing of the window
	 */
	onMinimize: function() {
		
	},
	/*
	 * Property: onMaximize
	 * 
	 * Summary:
	 * 		What to do upon maximize of window
	 */
	onMaximize: function() {
		
	},
	/*
	 * Property: showMaximize
	 * 
	 * Summary:
	 * 		Show whether or not to show the maximize button
	 */
	showMaximize: true,
	/*
	 * Property: showMinimize
	 * 
	 * Summary:
	 * 		Show whether or not to show the minimize button
	 */
	showMinimize: true,
	/*
	 * Property: showClose
	 * 
	 * Summary:
	 * 		Show whether or not to show the close button
	 */
	showClose: true,
	/*
	 * Property: maximized
	 * 
	 * Summary:
	 * 		Whether or not the window is maximized
	 * 		To set this after window creation, use <window.setBodyWidget>
	 */
	maximized: false,
	minimized: false,
	/*
	 * Property: height
	 * 
	 * Summary:
	 * 		The window's height in px, or %.
	 */
	height: "400px",
	/*
	 * Property: width
	 * 
	 * Summary:
	 * 		The window's width in px, or %.
	 */
	width: "500px",
	/*
	 * Property: title
	 * 
	 * Summary:
	 * 		The window's title
	 */
	title: "",
	/*
	 * Property: resizable
	 * 
	 * Summary:
	 * 		Weather or not the window is resizable.
	 */
	resizable: true,
	/*
	 * Property: pos
	 * 
	 * Summary:
	 * 		Internal variable used by the window maximizer
	 */
	pos: {},
	postCreate: function() {
		this.domNode.title="";
		this.makeDragger();
		this.sizeHandle = new dojox.layout.ResizeHandle({
			targetContainer: this.domNode,
			activeResize: true
		}, this.sizeHandle);
		if(!this.resizable)
		{
			this.killResizer();
		}
		dojo.addClass(this.sizeHandle.domNode, "win-resize");
		dojo.connect(this.sizeHandle.domNode, "onmousedown", this, function(e){
			this._resizeEnd = dojo.connect(document, "onmouseup", this, function(e){
				dojo.disconnect(this._resizeEnd);
				this.resize();
			});
		});
		
		if(dojo.isIE){
			dojo.connect(this.domNode,'onresize', this,"_onResize");
		}
		dojo.connect(window,'onresize',this,"_onResize");
		this.bringToFront();
	},
	/*
	 * Method: show
	 *  
	 * Summary:
	 * 		Shows the window
	 */
	show: function()
	{
			desktop.ui.containerNode.appendChild(this.domNode);
			dojo.style(this.domNode, "width", this.width);
			dojo.style(this.domNode, "height", this.height);
			this.titleNode.innerHTML = this.title;
			this._task = new desktop.ui.task({
				label: this.title,
				icon: this.icon,
				onClick: dojo.hitch(this, this._onTaskClick)
			});
			if(this.maximized == true) this.maximize();
			dojo.style(this.domNode, "display", "block");
			if (desktop.config.fx) {
				if (desktop.config.fx == 1) dojo.style(this.containerNode, "display", "none");
				dojo.style(this.domNode, "opacity", 0);
				var anim = dojo.fadeIn({
					node: this.domNode,
					duration: desktop.config.window.animSpeed
				});
				dojo.connect(anim, "onEnd", this, function() {
					if (desktop.config.fx == 1) dojo.style(this.containerNode, "display", "block");
					this.resize();
				});
				anim.play();
			} else this.resize();
	},
	_getPoints: function(box) {
		return {
			tl: {x: box.x, y: box.y},
			tr: {x: box.x+box.w, y: box.y},
			bl: {x: box.x, y: box.y+box.h},
			br: {x: box.x+box.w, y: box.y+box.h}
		}
	},
	_onTaskClick: function()
	{
		var s = this.domNode.style.display;
		if(s == "none")
		{
			this.restore();
			this.bringToFront();
		}
		else
		{
			if(!this.bringToFront()) this.minimize();
		}
	},
	_toggleMaximize: function() {
		if(this.maximized == true) this.unmaximize();
		else this.maximize();
	},
	/*
	 * Method: makeResizer
	 * 
	 * Summary:
	 * 		Internal method that makes a resizer for the window.
	 */
	makeResizer: function() {
		dojo.style(this.sizeHandle.domNode, "display", "block");
	},
	/*
	 * Method: killResizer
	 * 
	 * Summary:
	 * 		Internal method that gets rid of the resizer on the window.
	 */
	killResizer: function()
	{
		/*dojo.disconnect(this._dragging);
		dojo.disconnect(this._resizeEvent);
		dojo.disconnect(this._doconmouseup);
		this.sizeHandle.style.cursor = "default";*/
		dojo.style(this.sizeHandle.domNode, "display", "none");
	},
	/* 
	 * Method: minimize
	 * 
	 * Summary:
	 * 		Minimizes the window to the taskbar
	 */
	minimize: function()
	{
		this.onMinimize();
		if(desktop.config.fx == true)
		{
			dojo.style(this.containerNode, "display", "none");
			var pos = dojo.coords(this.domNode, true);
			this.left = pos.x;
			this.top = pos.y;
			var win = this.domNode;
			console.log("test");
			this._width = dojo.style(win, "width");
			this._height = dojo.style(win, "height");
			var pos = dojo.coords(this._task.nodes[0], true);
			var anim = dojo.animateProperty({
				node: this.domNode,
				duration: desktop.config.window.animSpeed,
				properties: {
					opacity: {end: 0},
					top: {end: pos.y},
					left: {end: pos.x},
					height: {end: 26}, //TODO: is there a way of detecting this?
					width: {end: 191} //and this?
				},
				easing: dojox.fx.easing.easeIn
			});
			dojo.connect(anim, "onEnd", this, function() {
				dojo.style(this.domNode, "display", "none");
			});
			anim.play();
		}
		else
		{
			dojo.style(this.domNode, "opacity", 100)
			dojo.style(this.domNode, "display", "none");
		}
		this.minimized = true;
	},
	/*
	 * Method: restore
	 * 
	 * Summary:
	 * 		Restores the window from the taskbar
	 */
	restore: function()
	{
		this.domNode.style.display = "inline";
		if(desktop.config.fx == true)
		{
			var anim = dojo.animateProperty({
				node: this.domNode,
				duration: desktop.config.window.animSpeed,
				properties: {
					opacity: {end: 100},
					top: {end: this.top},
					left: {end: this.left},
					height: {end: this._height},
					width: {end: this._width}
				},
				easing: dojox.fx.easing.easeOut
			});
			dojo.connect(anim, "onEnd", this, function() {
				dojo.style(this.containerNode, "display", "block");
				this.resize();
			});
			anim.play();
		}
		this.minimized = false;
	},
	/*
	 * Method: maximize
	 * 
	 * Summary:
	 * 		Maximizes the window
	 */
	maximize: function()
	{
		this.onMaximize();
		this.maximized = true;
		if(this._drag) this._drag.onMouseUp(); this._drag.destroy();
		this.killResizer();
		this.pos.top = dojo.style(this.domNode, "top");
		//this.pos.bottom = dojo.style(this.domNode, "bottom");
		this.pos.left = dojo.style(this.domNode, "left");
		//this.pos.right = dojo.style(this.domNode, "right");
		this.pos.width = dojo.style(this.domNode, "width");
		this.pos.height = dojo.style(this.domNode, "height");
		var win = this.domNode;
		
		if(desktop.config.fx == true)
		{
			//api.log("maximizing... (in style!)");
			dojo.style(this.containerNode, "display", "none");
			var max = desktop.ui._area.getBox();
			var anim = dojo.animateProperty({
				node: this.domNode,
				properties: {
					top: {end: max.T},
					left: {end: max.L},
					width: {end: dojo.style(this.domNode.parentNode, "width") - max.R},
					height: {end: dojo.style(this.domNode.parentNode, "height") - max.B}
				},
				duration: desktop.config.window.animSpeed
			});
			dojo.connect(anim, "onEnd", this, function() {
				dojo.style(this.containerNode, "display", "block");
				this._hideBorders();
				this.resize();
			});
			anim.play();
		}
		else
		{
			//api.log("maximizing...");
			win.style.top = "0px";
			win.style.left = "0px";
			win.style.width = dojo.style(this.domNode.parentNode, "width");
			win.style.height = dojo.style(this.domNode.parentNode, "height");
			this._hideBorders();
			this.resize();
		}
	},
	_showBorders: function() {
		dojo.forEach([
			"win-tr",
			"win-tl",
			"win-ml",
			"win-mr",
			"win-br",
			"win-bl",
			"win-bc"
		], function(item) {
			dojo.query("."+item+"-hidden", this.domNode).addClass(item).removeClass(item+"-hidden");
		});
	},
	_hideBorders: function() {
		dojo.forEach([
			"win-tr",
			"win-tl",
			"win-ml",
			"win-mr",
			"win-br",
			"win-bl",
			"win-bc"
		], function(item) {
			dojo.query("."+item, this.domNode).addClass(item+"-hidden").removeClass(item);
		});
	},
	makeDragger: function()
	{
		if(desktop.config.window.constrain) 
		{
			this._drag = new dojo.dnd.move.parentConstrainedMoveable(this.domNode, {
				handle: this.handle
			});
		}
		else
		{
			this._drag = new dojo.dnd.Moveable(this.domNode, {
				handle: this.handle
			});
		}
		this._dragStartListener = dojo.connect(this._drag, "onMoveStart", dojo.hitch(this, function(mover){
			dojo.style(this.containerNode, "display", "none");
		}));
		this._dragStopListener = dojo.connect(this._drag, "onMoveStop", dojo.hitch(this, function(mover){
			dojo.style(this.containerNode, "display", "block");
			this.resize();
		}));
	},
	/*
	 * Method: unmaximize
	 * Summary:
	 * 		UnMaximizes the window
	 */
	unmaximize: function()
	{
		this.makeDragger();
		if(this.resizable == true)
		{		
			this.makeResizer();
		}
		var win = this.domNode;
		if(desktop.config.fx == true)
		{
			this._showBorders();
			dojo.style(this.containerNode, "display", "none");
			var anim = dojo.animateProperty({
				node: this.domNode,
				properties: {
					top: {end: this.pos.top},
					left: {end: this.pos.left},
					width: {end: this.pos.width},
					height: {end: this.pos.height}
				},
				duration: desktop.config.window.animSpeed
			});
			dojo.connect(anim, "onEnd", this, function(e) {
				dojo.style(this.containerNode, "display", "block");
				this.resize();
			});
			void(anim); //fixes a weird ass IE bug. Don't ask me why :D
			anim.play();
		}
		else
		{
			win.style.top = this.pos.top;
			win.style.bottom = this.pos.bottom;
			win.style.left = this.pos.left;
			win.style.right = this.pos.right;
			win.style.height= this.pos.height;
			win.style.width= this.pos.width;
			this._showBorders();
			this.resize();
		}
		this.maximized = false;
	},
	/*
	 * Method: bringToFront
	 * 
	 * Summary:
	 * 		Brings the window to the front of the stack
	 * 
	 * Returns:	
	 * 		false - it had to be rased
	 * 		true - it was allready on top.
	 */
	bringToFront: function()
	{
		var ns = dojo.query("div.win", desktop.ui.containerNode);
		var maxZindex = 10;
		for(i=0;i<ns.length;i++)
		{
			if(dojo.style(ns[i], "display") == "none") continue;
			if(dojo.style(ns[i], "zIndex") > maxZindex)
			{
				maxZindex = dojo.style(ns[i], "zIndex");
			}
		}
		var zindex = dojo.style(this.domNode, "zIndex");
		if(maxZindex != zindex)
		{
			maxZindex++;
			dojo.style(this.domNode, "zIndex", maxZindex);
			return true;
		}
		return false;
	},
	uninitialize: function() {
		if(!this.closed) this.onClose();
		if(this._task) this._task.destroy();
		if(this._drag) this._drag.destroy();
		if(this.sizeHandle) this.sizeHandle.destroy();
	},
	/* 
	 * Method: close
	 * 
	 * Summary:
	 * 		closes the window
	 */
	close: function()
	{
		if (!this.closed) {
			this.closed = true;
			this.onClose();
			if (desktop.config.fx) {
				dojo.style(this.containerNode, "display", "none");
				var anim = dojo.fadeOut({
					node: this.domNode,
					duration: desktop.config.window.animSpeed
				});
				dojo.connect(anim, "onEnd", this, function(){
					this.domNode.parentNode.removeChild(this.domNode);
					this.destroy();
				});
				anim.play();
			}
			else {
				this.domNode.parentNode.removeChild(this.domNode);
				this.destroy();
			}
		}
	},
	resize: function(args){
		// summary:
		//		Explicitly set this widget's size (in pixels),
		//		and then call layout() to resize contents (and maybe adjust child widgets)
		//	
		// args: Object?
		//		{w: int, h: int, l: int, t: int}

		var node = this.domNode;

		// set margin box size, unless it wasn't specified, in which case use current size
		if(args){
			dojo.marginBox(node, args);

			// set offset of the node
			if(args.t){ node.style.top = args.t + "px"; }
			if(args.l){ node.style.left = args.l + "px"; }
		}
		// If either height or width wasn't specified by the user, then query node for it.
		// But note that setting the margin box and then immediately querying dimensions may return
		// inaccurate results, so try not to depend on it.
		var mb = dojo.mixin(dojo.marginBox(this.containerNode), args||{});

		// Save the size of my content box.
		this._contentBox = dijit.layout.marginBox2contentBox(this.containerNode, mb);

		// Callback for widget to adjust size of it's children
		this.layout();
	},
	layout: function(){
		dijit.layout.layoutChildren(this.containerNode, this._contentBox, this.getChildren());
	},

	addChild: function(/*Widget*/ child, /*Integer?*/ insertIndex){
		dijit._Container.prototype.addChild.apply(this, arguments);
		if(this._started){
			dijit.layout.layoutChildren(this.containerNode, this._contentBox, this.getChildren());
		}
	},

	removeChild: function(/*Widget*/ widget){
		dijit._Container.prototype.removeChild.apply(this, arguments);
		if(this._started){
			dijit.layout.layoutChildren(this.containerNode, this._contentBox, this.getChildren());
		}
	},
	_onResize: function(e) {
		if (this.maximized && !this.minimized) {
			var max = desktop.ui._area.getBox();
			var c = dojo.coords(this.domNode);
			var v = dijit.getViewport();
			dojo.style(this.domNode, "width", v.w - max.L - max.R);
			dojo.style(this.domNode, "height", v.h - max.T - max.B);
		}
		else if(this.maximized && this.minimized) {
			var max = desktop.ui._area.getBox();
			var v = dijit.getViewport();
			this.pos.width = v.w - max.L - max.R;
			this.pos.height = v.h - max.T - max.B;
		}
		this.resize();
	},
	startup: function() {
		this.inherited("startup", arguments);
		this.resize();
	}
});

dojo.extend(dijit._Widget, {
	// layoutAlign: String
	//		"none", "left", "right", "bottom", "top", and "client".
	//		See the LayoutContainer description for details on this parameter.
	layoutAlign: 'none'
});