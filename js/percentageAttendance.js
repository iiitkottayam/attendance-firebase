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
		attendancePercentageRecords();				
	}
});