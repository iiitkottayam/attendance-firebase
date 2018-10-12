function notifyWait(message,type){
	var Class='alert-light';
	type = type.toLowerCase();
	switch(type){
		case 'success':Class='alert-success';break;
		case 'error':Class='alert-danger';break;
		case 'info':Class='alert-warning';break;
	}
	var alert = "<br><div class='alert "+Class+" alert-dismissible fade show' role='alert'>"+'<i class="fa fa-spinner fa-spin" style="font-size:18px"></i> <span class="animated fadeIn">'+message+'</span><button type="button" class="close" data-dismiss="alert">&times;</button>'+"</div>";
	document.getElementById('feedback').innerHTML = alert;		
}

function get(name){
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
}

function calcPresentFrac(studid,courseid){
	notifyWait('Calculating Attendance','info');
	var dt = new Date();
	var totalSessions=0;
	var presentDays = 0;
	var dayDatas=[];
	var fetchedDocs=[];
	var year = dt.getFullYear().toString();
	var db = firebase.firestore();
	db.collection('attendance').doc(year).collection(courseid).get()
	.then((querySnapshot)=>{
		querySnapshot.forEach((dayDoc)=>{
			var thisDate = dayDoc.id;
			var totalSessionOfThisDay = Object.keys(dayDoc.data().session).length;
			totalSessions += totalSessionOfThisDay;
			var dayDataObj = {
				date : thisDate,
				totNoOfSessions: totalSessionOfThisDay
			};
			dayDatas.push(dayDataObj);
		});
	}).then(function(){
		for(x in dayDatas){
			for(var i=1; i <= dayDatas[x].totNoOfSessions ;i++){
				var thisdate = dayDatas[x].date;
				var sessid = 'session'+i;
				var docRef = db.collection('attendance').doc(year).collection(courseid).doc(thisdate).collection(sessid).doc(studid).get();
				fetchedDocs.push(docRef);
			}
		}
		return Promise.all(fetchedDocs);
	}).then(function(results){
		for(i in results){
			if(results[i].data().present == '1'){
				presentDays++;
			}
		}
		var percent = Math.round((presentDays/totalSessions)*100);
		if(percent<=80){
			document.getElementById(studid).style.color="#a94442";
		}
		document.getElementById(studid).innerHTML = '<span class="animated fadeIn">'+"Attended "+presentDays+" of "+totalSessions+" sessions<br>Percentage <i>"+percent+"%</i>"+'</span>';
		notify('Data Populated','success');
	})
	.catch(e=>{
		notify('Something went wrong','error');
		//console.log(e);
	})
}

setTimeout(function(){ logout(); }, 600000);

function displayProfile(){
	var user = firebase.auth().currentUser;
	var name = user.displayName;
	var email = user.email;
	document.getElementById('username').innerHTML='<span class="animated fadeIn">'+name+'</span>';
	document.getElementById('useremail').innerHTML='<span class="animated fadeIn">'+email+'</span>';
}

function notify(message,type){
	var Class='alert-light';
	type = type.toLowerCase();
	switch(type){
		case 'success':Class='alert-success';break;
		case 'error':Class='alert-danger';break;
		case 'info':Class='alert-warning';break;
	}
	var alert = "<br><div class='alert "+Class+" alert-dismissible fade show' role='alert'><span class='animated fadeIn'>"+message+'</span><button type="button" class="close" data-dismiss="alert">&times;</button>'+"</div>";
	document.getElementById('feedback').innerHTML = alert;
}

function names(){
	//looks for element with id - name_<student-index-number> and puts in the name
	var course=get('courseid');
	var db = firebase.firestore();
	var fetchedDoc=[];
	db.collection('courses').doc(course).get().then(function(doc){
		var enrolled = doc.data().enrolled;
		var j=0;
		for(var i=0;i<enrolled.length;i++){
			var studid = enrolled[i];
			var docRef = db.collection('students').doc(studid).get();
			fetchedDoc.push(docRef);
		}
		return Promise.all(fetchedDoc);
	}).then(function(results){
		for(i in results){
			document.getElementById("name_"+results[i].id).innerHTML=results[i].data().name;
		}
	})
}

function logout(){
	firebase.auth().signOut().then(function() {
		window.location = 'index.html';
		return;
	})
	.catch(function(error){
		notify('Something went wrong','error');
		//console.log(error);
	});
}