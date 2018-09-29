var config = {
	apiKey: "AIzaSyB6SkS7WTacu_BlwOLtfTwTUYSuKlvV1pI",
	authDomain: "institute-attendance-app.firebaseapp.com",
	projectId: "institute-attendance-app",
};
firebase.initializeApp(config);	
firebase.auth().onAuthStateChanged(function(){			
	var user = firebase.auth().currentUser;
		if(!user){
			window.location = 'index.html';
		}else{
			displayProfile();
			var db = firebase.firestore();
		var settings = {timestampsInSnapshots: true};
		db.settings(settings);	
		var db = firebase.firestore();
		var user = firebase.auth().currentUser;
		var userid = user.uid;
		var facultyIndex;
		db.collection('users').doc(userid).get().then(
			function(doc){
			facultyIndex = doc.data().index;
		}).then(function(){
			addNewSessionToday(facultyIndex);
		}).catch(e=>{
			console.log(e);
		})
	}
});