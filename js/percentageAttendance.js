function attendancePercentageRecords(){
	notifyWait('Fetching students','info');
	var db = firebase.firestore();
	var courseid = get('courseid');
	db.collection('courses').doc(courseid).get().then(doc=>{
		var enrolled = doc.data().enrolled;
		var head = "<h4 class=\"lead\">Percentage Record for "+courseid+"</h4><br><br>";
		var record=head+"<table class=\"table table-striped animated fadeIn\"><tr scope=\"row\"><th scope=\"col\">Student Id</th><th scope=\"col\">Name</th><th scope=\"col\">Percentage</th></tr>";
		for(var i=0;i<enrolled.length;i++){
			record += "<tr scope=\"row\"><td scope=\"col\">"+enrolled[i]+"</td><td scope=\"col\" id=\"name_"+enrolled[i]+"\"></td><td scope=\"col\" id=\""+enrolled[i]+"\"></td></tr>";
		}
		record+="</table>";
		document.getElementById('percentagedata').innerHTML = record;
		for(var i=0;i<enrolled.length;i++){
			calcPresentFrac(enrolled[i],courseid);
		}
		names();
	})
}

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