console.log('EvalSpace loaded');

// Make load PeerJS first

EvalSpace=function(url,cb,er){ // load script / JSON
	var s = document.createElement('script');
	s.src=url;
	s.id = 'UID'+Math.random().toString().slice(2);
	if(!!cb){s.onload=cb}
	if(!!er){s.onerror=er}
	document.body.appendChild(s);
	setTimeout('document.body.removeChild(document.getElementById("'+s.id+'"));',10000); // is the waiting still needed ?
	return s.id
};

EvalSpace('//cdn.peerjs.com/latest/peer.min.js',
function(){

// overright EvalSpace with the actual EvalSpace class

EvalSpace=function(APIkey,uid){

this.spaces=[]; // track eval spaces here
this.consoleLog=true;
this.APIkey='ime97m2i45bnvcxr'; // defaul APIkey, change it before connecting if you want to use a different one

this.uid=function(prefix){
		if(!prefix){prefix='UID'}
		var uid=prefix+Math.random().toString().slice(2);
		return uid
	};

this.load=function(url,cb,er){ // load script / JSON
		var s = document.createElement('script');
		s.src=url;
		s.id = this.uid();
		if(!!cb){s.onload=cb}
		if(!!er){s.onerror=er}
		document.body.appendChild(s);
		setTimeout('document.body.removeChild(document.getElementById("'+s.id+'"));',10000); // is the waiting still needed ?
		return s.id
	};

this.stringify=function(x){ // extends JSON.stringify to work with both values and functions
		var y=typeof(x);
		switch (y){
		case 'function':
			y=x.toString();
			break;		
		case 'object':
			if (Array.isArray(x)){
				var y='[';
				for(var i=0;i<x.length;i=i+1){
					y=y+this.stringify(x[i])+','
				}
				y=y.slice(0,y.length-1)+']';
			}
			else{
				y='{';
				for(var v in x){
					y=y+v+':'+this.stringify(x[v])+',';
				}
				y=y.slice(0,y.length-1)+'}';
			}
			break;
		case 'string':
			y=JSON.stringify(x);
			break;
			case 'number':
			y=JSON.stringify(x);
		default:
		}
		return y;
	};

this.connect=function(APIkey,uid){
	// build eval space
	console.log('building a WebRTC eval space ...');
	if(!!APIkey){this.APIkey=APIkey};
	if(!uid){this.id=this.uid('evalSpace')}
	else{this.id=uid};
	// create peer
	this.peer = new Peer(this.id,{key: this.APIkey});
	// track it
	if(!EvalSpace.spaces){EvalSpace.spaces={}};
	EvalSpace.spaces[this.id]=this;
	// find out if it is a submitter, an evaluator or an error	
	this.peer.on('open',function(){ // it is a submitter
		EvalSpace.spaces[this.id].buildSubmiter();
	})

	this.peer.on('error',function(err){ // find out if this is an evaluator first
		if(err.type=="unavailable-id"){EvalSpace.spaces[this.id].buildEvaluator()} // it is an evaluator !
		else{throw('PeerJS error: '+err.type)}
	})
	this.callMe='new EvalSpace("'+this.APIkey+'","'+this.id+'")';
	return this.id;
};

this.buildSubmiter=function(){
	this.role='submitter';
	console.log('role: ',this.role);
	// listen to callBacks from evaluators
	this.peer.on('connection', function(conn) {
		conn.on('data', function(data){
			console.log(data.id+' < '+data.Y);
			//console.log('received: ',data);
		})
	});
	// evaluate function
	this.evaluate=function(data,evaluator){
		if(typeof(data)=='string'){
			data={
				id:this.uid('task'),
				X:data
			}
		}
		data.spaceId=this.id; // tracking which space will be dealing with this data
		// list of evaluators
		var evs=Object.getOwnPropertyNames(this.peer.connections);	
		// if evaluator was selected by its position in the list of connections
		if(typeof(evaluator)=='number'){
			evaluator=this.peer.connections[evs[evaluator]].peerjs;
		}
		// if no evaluator was specified pick one randomly
		if(!evaluator){
			if(evs.length==0){error('no connections were found')}
			else{
				var i = Math.floor(Math.random()*evs.length);
				evaluator=this.peer.connections[evs[i]].peerjs;
			}
		}
		// ready to send
		evaluator.send(data);

		if(EvalSpace.spaces[data.spaceId].consoleLog){
			console.log(data.id+' > '+data.X);
		}
		return data.id; // return id of call
	}

	if(this.consoleLog){
		console.log('to activate evaluators do: ',this.callMe);
	}

};

this.buildEvaluator=function(){
	this.role='evaluator';
	console.log('role: ',this.role);
	// connect again, now as an evaluator
	var uid = this.uid('evaluator');
	this.peer = new Peer(uid,{key: this.APIkey});
	this.callBack = this.peer.connect(this.id); // give notice to submitter
	this.callBack.on('data',function(data){
		if(EvalSpace.spaces[data.spaceId].consoleLog){
			console.log(data.id+' < '+data.X);
		}
		
		try {
			data.Y = eval(data.X);
			data.err = false;
		}
		catch (err){
			data.A = err;
			data.err = true;
		}

		if(EvalSpace.spaces[data.spaceId].consoleLog){
			console.log(data.id+' > '+data.Y);
		}

		//console.log('evaled data: ',data);
		this.send(data);

	});
};

this.connect(APIkey,uid);

};


	})


//EvalSpace.spaces=[]; // track eval spaces here
/*

if(!window.Peer){ // make sure PeerJS is loaded
	(new EvalSpace()).load('//cdn.peerjs.com/latest/peer.min.js');
}
*/
