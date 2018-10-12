function viewStudentAttendance(studid,courseid){
	notifyWait('Fetching attendance records','info');
	var totalSessions=0;
	var maxSession = 0;
	var presentDays = 0;
	var db = firebase.firestore();
	var dayDatas=[];
	var fetchedDocs=[];
	var record="<h4 class=\"lead\">Attendance Record for <i>"+courseid+"</i></h4>";
	var dt = new Date();
	var year = dt.getFullYear().toString();
	db.collection('attendance').doc(year).collection(courseid).get()
	.then((querySnapshot)=>{
		querySnapshot.forEach((dayDoc)=>{
			var thisDate = dayDoc.id;
			var totalSessionOfThisDay = Object.keys(dayDoc.data().session).length;
			maxSession = (totalSessionOfThisDay>maxSession)?totalSessionOfThisDay:maxSession;
			var dayDataObj = {
				date : thisDate,
				totNoOfSessions: totalSessionOfThisDay
			};
			dayDatas.push(dayDataObj);
		});
	})
	.then(function()
	{
		for(x in dayDatas){
			for(var i=1; i <= dayDatas[x].totNoOfSessions ;i++){
				var thisdate = dayDatas[x].date;
				var sessid = 'session'+i;
				var docRef = db.collection('attendance').doc(year).collection(courseid).doc(thisdate).collection(sessid).doc(studid).get();
				fetchedDocs.push(docRef);
			}
		}
		return Promise.all(fetchedDocs);
	})
	.then(function(results){
		var dates=[];
		for(i in results){
			dates.push(((results[i].ref.path).split('/'))[3]);
		}
		dates = new Set(dates);
		dates = Array.from(dates);
		record+="<table class=\"table table-striped\"><tr scope=\"row\"><th scope=\"col\">Date</th>";
		for(var j=1;j<=maxSession;j++){
			record+="<th scope=\"col\">Session "+j+" </th>";
		}
		record+="</tr>";
		for(var i=0;i<dates.length;i++){
			record += "<tr scope=\"row\"><th scope=\"col\">"+dates[i].slice(0,2)+'/'+dates[i].slice(2,4)+'/'+dates[i].slice(4,8)+"</th>";
			for(var j=1;j<=maxSession;j++){
				record+="<td scope=\"col\" id=\""+dates[i]+"_session"+j+"\">No Class</td>";
			}
			record+="</tr>";
		}
		record+="</table>";
		document.getElementById('attendancedata').innerHTML=record;
		notifyWait('Populating attendance data','info');
		for(i in results){
			var data = results[i].data().present;
			var mdata = results[i].ref.path;
			mdata = mdata.split('/');
			var date = mdata[3];
			var session = mdata[4];
			var text=(data=='0')?'Absent':'Present';
			var clr=(data=='0')?'#721c24':'#155724';
			document.getElementById(date+"_"+session).style.color=clr;
			document.getElementById(date+"_"+session).innerHTML=text;
		}
		notify('Attendance records populated','success');
	})
	.catch(e=>{
		notify('Something went wrong','error');
		//console.log(e);
	})
}

function viewAttendance(){
	notifyWait('Fetching attendance records','info');
	var courseid = get('courseid');
	var dt = new Date();
	var year = dt.getFullYear().toString();
	var day = document.getElementById('day').value;
	var month  = document.getElementById('month').value;
	day = day.toString();			
	month = month.toString();
	if(day.length != 2){
		day = "0"+day;
	}
	if(month.length != 2){
		month="0"+month;
	}
	var docid = day+month+year;
	var attendanceData = {};
	var db = firebase.firestore();
	var noOfSessions=0;
	db.collection('attendance').doc(year).collection(courseid).doc(docid).get().then(function(docu){
		noOfSessions = Object.keys(docu.data().session).length;	//number of sessions
		//lets gets student enrolled
		db.collection('courses').doc(courseid).get().then(function(doc){
			var students = doc.data().enrolled;
			var head ="<div class=\"col\"><div class=\"row\"><div class=\"col\"><br></div></div>";
			var head = head+"<div class=\"row\"><div class=\"col\"><h4 class=\"lead\">Viewing Attendance Record for "+courseid+"/<i>"+doc.data().name+"</i>-&nbsp;<i>"+day+"/"+month+"/"+year+"</i></h4></div></div><div class=\"row\"><div class=\"col\">";
			var record=head+"<table class=\"table table-striped animated fadeIn\"><tr scope=\"row\"><th scope=\"col\">Student Id</th><th scope=\"col\">Name</th>";
			for(var j=1;j<=noOfSessions;j++){
				record+="<th scope=\"col\">Session "+j+" </th>";
			}
			record+="</tr>";
			for(var i=0;i<students.length;i++){
				record += "<tr scope=\"row\"><td scope=\"col\">"+students[i]+"</td><td scope=\"col\" id=\"name_"+students[i]+"\"></td>";
				for(var j=1;j<=noOfSessions;j++){
					record+="<td scope=\"col\" id=\""+students[i]+"_session"+j+"\"></td>";
				}
				record+="</tr>";
			}
			record+="</table></div></div></div>";
			document.getElementById('attendancedata').innerHTML=record;
			names();
			for(var i=1;i<=noOfSessions;i++){
				getsessioninfo(year,courseid,docid,'session'+i);
			}
		}).catch(function(){
			notify('Something went wrong','error');
			//console.log('error');
		});
		}).catch(function(error){
			notify('Attendance records for this day does not exist.','error');
			//console.log(error);
	})
}

function getsessioninfo(year,courseid,docid,sessid){
	var db = firebase.firestore();
	var dbRef = db.collection('attendance').doc(year).collection(courseid).doc(docid).collection(sessid);
	var dbPromise = dbRef.get();
	var sessiondata={};
	dbPromise.then(function(querysnapshot){
		notifyWait('Populating attendance records','info');
		querysnapshot.forEach(function(doc){
			var studentid = doc.id.toString();
			var ele = document.getElementById(studentid+'_'+sessid);
			ele.setAttribute("onmouseover","this.getElementsByTagName('i')[0].style.display='inline-block'");
			ele.setAttribute("onmouseout","this.getElementsByTagName('i')[0].style.display='none'");
			ele.innerHTML=(doc.data().present==1)?'Present':'Absent';
			ele.innerHTML+="<i style=\"display:none\" class=\"fas fa-pen-alt\"></i>";
			ele.style.color=(doc.data().present==1)?'#155724':'#721c24';
			ele.getElementsByTagName('i')[0].setAttribute("onclick","updateAttendance('"+year+"','"+courseid+"','"+docid+"','"+sessid+"','"+studentid+"','"+doc.data().present+"')");
		})
		notify('Attendance Records Populated to View','success');
	}).catch(function(err){
		notify('Something went wrong','error');
		//console.log('Error getting data from session',err);
	})
}

function updateAttendance(year,courseid,docid,sessid,studentid,status){	
	notifyWait('Update initiated for '+studentid+' for '+sessid+'...','info');
	var db = firebase.firestore();
	var studRef = db.collection('attendance').doc(year).collection(courseid).doc(docid).collection(sessid).doc(studentid);
	studRef.get().then(function(doc){
		if(!doc.exists){
			notify('Something went wrong','error');
		}
		else{
			if(status==0){
				studRef.set({present:"1"}).then(function(){
					notify('Updated record for '+studentid+' to Present for '+sessid,'success');
					var ele = document.getElementById(studentid+'_'+sessid);
					ele.innerHTML='Present';
					ele.innerHTML+=" <i style=\"display:none\" class=\"fas fa-pen-alt\"></i>";
					ele.style.color='#155724';
					ele.setAttribute("onclick","updateAttendance('"+year+"','"+courseid+"','"+docid+"','"+sessid+"','"+studentid+"','1')");
					}).catch(function(err){
						notify('Updated failed for '+studentid+' for '+sessid,'error');
						//console.log('Update failed ',err)
					});
			}else if(status == 1){
				studRef.set({present:"0"}).then(function(){
					notify('Updated record for '+studentid+' to Absent for '+sessid,'success');
					var ele = document.getElementById(studentid+'_'+sessid);
					ele.innerHTML='Absent';
					ele.innerHTML+=" <i style=\"display:none\" class=\"fas fa-pen-alt\"></i>";
					ele.style.color='#721c24';
					ele.setAttribute("onclick","updateAttendance('"+year+"','"+courseid+"','"+docid+"','"+sessid+"','"+studentid+"','0')");
				}).catch(function(err){
					notify('Updated failed for '+studentid+' for '+sessid,'error');
					//console.log('Update failed ',err)
				});
			}else{
				notify('Could not finish update','error');
				//console.log('Only absent/present supported');
			}
		}
	}).catch(function(err){
		notify('Something went wrong','error');
		//console.log(err);
	});
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