console.log('evalSpace loaded');

evalSpace={

	consoleLog:true,

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
		this.connect=function(APIkey,uid){
			if(!!APIkey){evalSpace.APIkey=APIkey};
			if(!uid){uid=evalSpace.uid('evalSpace')};
			evalSpace.id=uid;
			evalSpace.peer = new Peer(uid,{key: evalSpace.APIkey});

			// give it a second or two and check if it is connected
			setTimeout(function(){
					//console.log('connected: ',evalSpace.peer.isConnected()); // this is assynchronous
					
					if(evalSpace.peer.isConnected()){// then this is the SUBMITTER
						evalSpace.role='submitter';

						// listen to callBacks from evaluators
						evalSpace.peer.on('connection', function(conn) {
							conn.on('data', function(data){
								console.log(data.id+' < '+data.Y);
								//console.log('received: ',data);
							})
						});


						// evaluate function
						evalSpace.evaluate=function(data,evaluator){
							if(typeof(data)=='string'){
								data={
									id:evalSpace.uid('id'),
									X:data
								}
							}
							// list of evaluators
							var evs=Object.getOwnPropertyNames(evalSpace.peer.connections);	
							// if evaluator was selected by its position in the list of connections
							if(typeof(evaluator)=='number'){
								evaluator=evalSpace.peer.connections[evs[evaluator]].peerjs;
							}
							// if no evaluator was specified pick one randomly
							if(!evaluator){
								if(evs.length==0){error('no connections were found')}
								else{
									var i = Math.floor(Math.random()*evs.length);
									evaluator=evalSpace.peer.connections[evs[i]].peerjs;
								}
							}
							// ready to send
							evaluator.send(data);

							if(consoleLog){
								console.log(data.id+' > '+data.X);
							}
							

							return data.id; // return id of call

						}
					} 
					
					else {
						evalSpace.role='evaluator';
						// connect again, now as an evaluator
						var uid = evalSpace.uid('evaluator');
						evalSpace.peer = new Peer(uid,{key: evalSpace.APIkey});
						evalSpace.callBack = evalSpace.peer.connect(evalSpace.id); // give notice to submitter
						evalSpace.callBack.on('data',function(data){
							console.log(data.id+' < '+data.X);
							try {
								data.Y = eval(data.X);
								data.err = false;
							}
							catch (err){
								data.A = err;
								data.err = true;
							}

							if(consoleLog){
								console.log(data.id+' > '+data.Y);
							}

							//console.log('evaled data: ',data);
							evalSpace.callBack.send(data);

						});
					};
					
					console.log('role: ',evalSpace.role);
					if(evalSpace.role=='submitter'){
						if(consoleLog){
							console.log('Evaluators: evalSpace.connect("'+evalSpace.APIkey+'","'+evalSpace.id+'")');
						}
					}
				}
			,1000)

			
			return uid;
		}

	}
};



if(!window.Peer){ // make sure DataChennal is loaded first
	evalSpace.load('//cdn.peerjs.com/latest/peer.min.js',function(){
		evalSpace.buildThis();
	})
} else {
	evalSpace.build();
}
