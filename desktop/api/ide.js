/*
    Psych Desktop
    Copyright (C) 2006 Psychiccyberfreak

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

api.ide = new function()
{
	this.compile = function(code)
	{
		var compiledCode = "";
		for(count=0;count<=this.functions.length-1;count++)
		{
			if(count != 0)
			{
				compiledCode += "this."+code[count].name+" = function("+this.code[count].args+")\n{\n";
				compiledCode += code[count].code;
				compiledCode += "\n}\n\n";
			}
		}
		return compiledCode;
	}
	this.execute = function(lib, code)
	{
		var bin = this.compile(lib, code);
		var xml_seperator = desktop.app.xml_seperator;
		var emulated_data = "-666"+xml_seperator+" "+xml_seperator+" "+xml_seperator+" "+xml_seperator+bin.code+xml_seperator+bin.library+xml_seperator+" "+xml_seperator+" "+xml_seperator+" "+xml_seperator;
		desktop.app.fetchAppCallback("", emulated_data, "");
		desktop.app.launch(-666);
	}
	this.save = function(app)
	{
		if(app.id != undefined &&
	        app.metadata.title != undefined &&
	        app.metadata.author != undefined &&
	        app.metadata.email != undefined &&
	        app.metadata.version != undefined &&
	        app.metadata.maturity != undefined &&
	        app.metadata.category != undefined &&
	        app.code != undefined &&
			app.lib != undefined)
		{
	          var ide_headers = new Object();
	          this.compile(app.lib, app.code);
	          dojo.io.bind({
	               url: "../backend/ide.php",
	               method: "POST",
	               content : {
	                    appid: app.id,
	                    name: app.metadata.title,
	                    author: app.metadata.author,
	                    email: app.metadata.email,
	                    version: app.metadata.version,
	                    maturity: app.metadata.maturity,
	                    category: app.metadata.category,
	                    code: app.code
	               },
	               load: function(type, data, evt){
						app.callback(parseInt(data));
				   },
	               mimetype: "text/plain"
	          });
	     }
		 else
		 {
		 	return false;
		 }
	}
	this.load = function(appID)
	{
		dojo.io.bind({
			url: "../backend/app.php?id="+appID,
			load: function(type, data, evt)
			{
				start = data.indexOf("{");
				argsStart = data.lastIndexOf("(", start);
				argsEnd = data.lastIndexOf(")", start);
				args = data.substring(argsStart+1, argsEnd-1);
				//look for func name
				buffer = start;
				while((data.indexOf("{", buffer) != -1 || data.indexOf("}", buffer) != -1) || (data.indexOf("{", buffer) != -1 && data.indexOf("}", buffer) != -1))
				{
					//keep getting function body...
				}
			},
			mimetype: "text/plain"
		});
	}
	this.getAppList = function(callback) {
		var call = function(test) {alert(test)}
	dojo.io.bind({
		url: "../backend/app.php?action=getPrograms",
		load: function(type, data, evt)
		{
			data = data.split(desktop.app.xml_seperator);
			for(x=3;x<=data.length-1;x=x+3)
			{
				apps[data[x]] = new Array();
			}
			for(x=0;x<=data.length-1;x=x+4)
			{
				apps[data[x+3]][apps[data[x+3]].length] = new Object();
				apps[data[x+3]][apps[data[x+3]].length-1].id=data[x];
				apps[data[x+3]][apps[data[x+3]].length-1].name=data[x+1];
			}
			call(apps);
		},
		mimetype: "text/plain"
	});
	}
}