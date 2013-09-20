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

	build:function(){
		// build eval machine here
		console.log('building eval machine ...')
		this.connect=function(uid){
			evalMachine.channel = new DataChannel(uid);
		}

	}
};



if(!window.Peer){ // make sure DataChennal is loaded first
	evalMachine.load('//cdn.peerjs.com/latest/peer.min.js',function(){
		evalMachine.build();
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