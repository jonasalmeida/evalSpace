console.log('evalMachine loaded');

evalMachine={

	uid:function(prefix){
		if(!prefix){prefix='UID'}
		var uid=prefix+Math.random().toString().slice(2);
		return uid
	},

	load:function(url,cb,er){ // load script / JSON
		var s = document.createElement('script');
		s.src=url;
		s.id = this.uid();
		if(!!cb){s.onload=cb}
		if(!!er){s.onerror=er}
		document.body.appendChild(s);
		setTimeout('document.body.removeChild(document.getElementById("'+s.id+'"));',10000); // is the waiting still needed ?
		return s.id
	},

	stringify:function(x){ // extends JSON.stringify to work with both values and functions
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
	},

	buildThis:function(){
		// build eval machine here
		console.log('building eval machine ...');

		// get connection specs
		this.APIkey='u5ouack7vtkgwrk9'; // defaul APIkey, change it before connecting if you want to use a different one
		this.connect=function(uid){
			if(!uid){uid=evalMachine.uid('evalMachine')};
			evalMachine.id=uid;
			evalMachine.peer = new Peer(uid,{key: evalMachine.APIkey});

			// give it a second or two and check if it is connected
			setTimeout(function(){
					//console.log('connected: ',evalMachine.peer.isConnected()); // this is assynchronous
					
					if(evalMachine.peer.isConnected()){// then this is the SUBMITTER
						evalMachine.role='submitter';

						// listen to callBacks from evaluators
						evalMachine.peer.on('connection', function(conn) {
							conn.on('data', function(data){
								console.log(data.id+' < '+data.Y);
								//console.log('received: ',data);
							})
						});


						// evaluate function
						evalMachine.evaluate=function(data,evaluator){
							if(typeof(data)=='string'){
								data={
									id:evalMachine.uid('id'),
									X:data
								}
							}
							// list of evaluators
							var evs=Object.getOwnPropertyNames(evalMachine.peer.connections);	
							// if evaluator was selected by its position in the list of connections
							if(typeof(evaluator)=='number'){
								evaluator=evalMachine.peer.connections[evs[evaluator]].peerjs;
							}
							// if no evaluator was specified pick one randomly
							if(!evaluator){
								if(evs.length==0){error('no connections were found')}
								else{
									var i = Math.floor(Math.random()*evs.length);
									evaluator=evalMachine.peer.connections[evs[i]].peerjs;
								}
							}
							console.log(evaluator);
							// ready to send
							evaluator.send(data);
							console.log(data.id+' > '+data.X);

							return data.id; // return id of call

						}
					} 
					
					else {
						evalMachine.role='evaluator';
						// connect again, now as an evaluator
						var uid = evalMachine.uid('evaluator');
						evalMachine.peer = new Peer(uid,{key: evalMachine.APIkey});
						evalMachine.callBack = evalMachine.peer.connect(evalMachine.id); // give notice to submitter
						evalMachine.callBack.on('data',function(data){
							console.log(data.id+' < '+data.X);
							try {
								data.Y = eval(data.X);
								data.err = false;
							}
							catch (err){
								data.A = err;
								data.err = true;
							}
							console.log(data.id+' > '+data.Y);
							//console.log('evaled data: ',data);
							evalMachine.callBack.send(data);

						});
					};
					
					console.log('role: ',evalMachine.role);
				}
			,1000)

			
			return uid;
		}

	}
};



if(!window.Peer){ // make sure DataChennal is loaded first
	evalMachine.load('//cdn.peerjs.com/latest/peer.min.js',function(){
		evalMachine.buildThis();
	})
} else {
	evalMachine.build();
}




/*
// make sure PUBNUB libraries are loaded
if(!window.PUBNUB){
	evalMachine.load('https://cdn.pubnub.com/pubnub.min.js',function(){
		evalMachine.load('https://rawgithub.com/pubnub/webrtc/master/src/webrtc-beta-pubnub.js',function(){
			evalMachine.build();
		})
	})
} else {
	evalMachine.build();
}
*/