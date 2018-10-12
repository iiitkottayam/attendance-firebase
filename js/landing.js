firebase.auth().onAuthStateChanged(function(){
	var user = firebase.auth().currentUser;
		if(!user){
			window.location = 'index.html';
		}else{
			displayProfile();
			var db = firebase.firestore();
		var settings = {timestampsInSnapshots: true};
		db.settings(settings);
		var userInfo = db.collection("users").doc(user.uid);
		  userInfo.get().then(function(doc){
		  if(doc.exists){
			var id = doc.data().index;
			var typeId = doc.data().type;
			var type = (typeId == 3)?'Student':((typeId == 2)?'Faculty':'Invalid');
			if (typeId == 3 || typeId == 2){
				var collectionName = (typeId==2)?'faculties':'students';
				var userCourses = db.collection(collectionName).doc(id);
					userCourses.get().then(function(doc){
						if(doc.exists){
							displayCourses(doc.data().courses,typeId);
						}else{
							console.log('No data found for user while fetching courses');
						}
					}).catch(function(error){
						console.log('Error Reading document while fetching courses : ',error);
					})
				}else{
					console.log('Error you do not belong to either faculty class or student class');
				}
  			}else{
  				console.log('No data found for user');
  				console.log('No such data');
  			}
  		}).catch(function(error){
  			console.log('Error Reading document :', error);
  		});
		}
});

function displayPercentage(course){ //on landing page
	firebase.auth().onAuthStateChanged(function(){			
		var user = firebase.auth().currentUser;
		if(!user){
			window.location = 'index.html';
		}else{
			var uid = firebase.auth().currentUser.uid;
			var db = firebase.firestore();
			db.collection('users').doc(uid).get().then(function(doc){
				var index = doc.data().index;
				document.getElementById('studPer').innerHTML='<div>'+course+'<br><i><span id='+index+'></span></i></div><br>';
				calcPresentFrac(index,course);
			})
		}
	})	
}

function linkViewAttendance(ele){
  	var courseId = ele.getAttribute('courseid');
  	window.location = "viewAttendance.html?courseid="+courseId;
}

function linkPercentageAttendance(ele){
  	var courseId = ele.getAttribute('courseid');
  	window.location = "percentageAttendance.html?courseid="+courseId;
}

function linkRecordAttendance(ele){
  	var courseId = ele.getAttribute('courseid');
  	$('#newSessionWarning').modal('show');
  	document.getElementById('recordAttendanceSureBtn').setAttribute('onclick','window.location = "recordAttendance.html?courseid='+courseId+'";');
}

function displayCourses(courses,type){
  	var ele = document.getElementById('courses');
  	var inner = '';
  	for(var i=0;i<courses.length;i++){
  		inner+='<div class="card col-12 col-sm-6 animated fadeIn" style="margin-top:10px;border:none"><div class="card-body"><h5 class="card-title">'+courses[i]+'</h5><hr><p class="card-text">Some quick example text to build on the card title and make up the bulk of the card content.</p>';
  		if(type==2){
  			inner+='<button role="button" href="#" class="btn btn-primary text-white" onclick="linkRecordAttendance(this)" courseid="'+courses[i]+'">New Session</button>';
  			inner+='<button role="button" href="#" class="btn btn-primary text-white" onclick="linkPercentageAttendance(this)" courseid="'+courses[i]+'">% Details</button>';
  			inner+='<button role="button" href="#" onclick="linkViewAttendance(this)" courseid="'+courses[i]+'" class="btn btn-primary text-white">View/Edit History</button></div></div>';
  		}
  		if(type==3){
  			inner+='<button role="button" href="#" class="btn btn-primary text-white" onclick="displayPercentage(\''+courses[i]+'\')">% Details</button>';
  			inner+='<button role="button" href="#" onclick="linkViewAttendance(this)" courseid="'+courses[i]+'" class="btn btn-primary text-white">View</button></div></div>';
		}				
  	}
  	ele.innerHTML = inner;
}