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
			var userInfo = db.collection("users").doc(user.uid);
			userInfo.get().then(function(doc){
		  		if(doc.exists){
			  		var typeId = doc.data().type;
					if (typeId == 3){
						viewStudentAttendance(doc.data().index,get('courseid'));
					}else if(typeId == 2){
						var dt = new Date();
						var day = dt.getDate().toString();
						var month = (dt.getMonth()+1).toString();
						var year = dt.getFullYear().toString();
						document.getElementById('dateform').style.display='block';
						document.getElementById('day').value=day;
						document.getElementById('month').value=month;
						document.getElementById('year').value=year;
						viewAttendance();
					}
					else{
						console.log('Error you do not belong to either faculty class or student class');
					}
	  			}else{
	  				console.log('No data found for user');
	  				console.log('No such data');
	  			}
  			}).catch(function(error){
	  			console.log('Error Reading document :', error);
	  		})
			}
		});