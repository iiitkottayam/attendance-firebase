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

function getAttendanceTableForNewSession(newSessionNo){
	var tableData = '';
	var enrolled;
	var db= firebase.firestore();
	var courseid = get('courseid');
	db.collection('courses').doc(courseid).get()
	.then((courseDoc)=>{
		notifyWait("Fetching Students",'info');
		enrolled = courseDoc.data().enrolled;
		for(i in enrolled){
			tableData+='<tr><td class="animated fadeIn">'+enrolled[i]+'</td><td id=studName_'+enrolled[i]+'></td><td id='+enrolled[i]+'_session'+newSessionNo+'></td></tr>';
		}
	})
	.then(function(){
		var dt = new Date();
		var day = dt.getDate().toString();
		var month = (dt.getMonth()+1).toString();
		var year = dt.getFullYear().toString();
		if(day.length != 2){
		day = "0"+day;
		}
		if(month.length != 2){
			month="0"+month;
		}
		var tdate = day+month+year;
		document.getElementById('attendanceTableBody').innerHTML=tableData;
		db.collection('attendance').doc(year).collection(courseid).doc(tdate).collection('session'+newSessionNo).get()
		.then((querySnapshot)=>{
			notifyWait("Fetching presence/absence status",'info');
			querySnapshot.forEach((doc)=>{
				var sessid = 'session'+newSessionNo;
				var rollNo = doc.id;
				db.collection('students').doc(doc.id).get()
				.then((studDoc)=>{
					sname = studDoc.data().name;
					document.getElementById('studName_'+rollNo).innerHTML='<span class="animated fadeIn">'+sname+'</span>';
				});
				var ele = document.getElementById(rollNo+'_session'+newSessionNo);

				if(doc.data().present==1)
				{
					ele.innerHTML+=`<label class="switch animated fadeIn">
	  									<input id="box" type="checkbox" checked>
	  									<span class="slider round"></span>
									</label>`;	
				}
				else
				{
					ele.innerHTML+=`<label class="switch animated fadeIn">
	  									<input id="box" type="checkbox">
	  									<span class="slider round"></span>
									</label>`;
				}

				ele.firstChild.children[1].setAttribute("onclick","updateAttendanceWithSwitch('"+year+"','"+courseid+"','"+tdate+"','"+sessid+"','"+rollNo+"')");
				notify('Data Populated','success');
			});
		}).catch((error)=>{
			notify('Something went wrong','error');
			//console.log(error);
		});
	}).catch((error)=>{
		notify('Something went wrong','error');
		//console.log(error);
	});
}

function updateAttendanceWithSwitch(year,courseid,docid,sessid,studentid)
{	
  	notifyWait('Update initiated for '+studentid+' for '+sessid+'...','info');
  	var db = firebase.firestore();
  	var studRef = db.collection('attendance').doc(year).collection(courseid).doc(docid).collection(sessid).doc(studentid);
  	var ele = document.getElementById(studentid+'_'+sessid);
  	studRef.get().then(function(doc){
  		if(!doc.exists)
  		{
  			// alert('ele.firstChild.children[0].checked 34235= '+ele.firstChild.children[0].checked);
  			ele.firstChild.children[0].checked = !ele.firstChild.children[0].checked;
  			notify('Something went wrong (session->rollNo doc doesnt exist!)','error');
  		}
  		else
  		{
  			if(ele.firstChild.children[0].checked)
  			{
	  			studRef.set({present:"1"})
	  				.then(function(){
	  					notify('Updated record for '+studentid+' to Present for '+sessid,'success');
  					})
  					.catch(function(err){
  						ele.firstChild.children[0].checked = !ele.firstChild.children[0].checked;
  						notify('Updated failed for '+studentid+' for '+sessid,'error');
  						//console.log('Update failed ',err)
  					});
	  		}
	  		else if(!ele.firstChild.children[0].checked)
	  		{
	  			studRef.set({present:"0"})
	  			.then(function(){
	  				notify('Updated record for '+studentid+' to Absent for '+sessid,'success');
  				})
  				.catch(function(err){
  					ele.firstChild.children[0].checked = !ele.firstChild.children[0].checked;
  					notify('Updated failed for '+studentid+' for '+sessid,'error');
  					//console.log('Update failed ',err)
  				});
	  		}
	  		else
	  		{
	  			ele.firstChild.children[0].checked = !ele.firstChild.children[0].checked;
	  			notify('Could not finish update','error');
	  			//console.log('Only absent/present supported');
	  		}
  		}
  	}).catch(function(err){
  		ele.firstChild.children[0].checked = !ele.firstChild.children[0].checked;
  		notify('Something went wrong','error');
  		//console.log(err);
  	});
}


function addNewSessionToday(facultyIndex){
	var db = firebase.firestore();
	notifyWait('Creating new session','info');
	var dt = new Date();
	var day = dt.getDate().toString();
	var month = (dt.getMonth()+1).toString();
	var year = dt.getFullYear().toString();
	var newSessionNo = 1;
	if(day.length != 2){
		day = "0"+day;
	}
	if(month.length != 2){
		month="0"+month;
	}
	var tdate = day+month+year;
	var courseid = get('courseid');
	db.collection('attendance').doc('2018').collection(courseid).doc(tdate).get()
	.then((docSnapshot)=>{
		if(docSnapshot.exists){
			db.collection('attendance').doc('2018').collection(courseid).doc(tdate).get()
			.then((doc)=>{
				newSessionNo = Object.keys(doc.data().session).length + 1;
				document.getElementById('todayDate').innerHTML = '<span class="animated fadeIn">'+'Date : '+day+'/'+month+'/'+year+'</span>';
				document.getElementById('currentCourse').innerHTML = '<span class="animated fadeIn">'+'Course : '+courseid+'</span>';
				document.getElementById('currentSession').innerHTML = '<span class="animated fadeIn">'+'Session : '+newSessionNo+'</span>';
				db.collection('attendance').doc('2018').collection(courseid).doc(tdate)
				.update({
					['session.'+newSessionNo]:{
						takenBy : facultyIndex,
						timeStamp: new Date()
					}
				}).then(function(){
					db.collection('courses').doc(courseid).get()
					.then((courseDoc)=>{
						var enrolledStuds = courseDoc.data().enrolled;
						for(x in enrolledStuds){
							db.collection('attendance').doc('2018').collection(courseid).doc(tdate).collection('session'+newSessionNo).doc(enrolledStuds[x])
							.set({
								present:'1'
							}).then(function(){
							}).catch((error)=>{
								notify('Something went wrong','error');
								//console.log(error);
							});
						}
					}).then(function(){
						getAttendanceTableForNewSession(newSessionNo);
					}).catch((error)=>{
						notify('Something went wrong','error');
						//console.log('error',error);
					});

				}).catch((error)=>{
					notify('Something went wrong','error');
					//console.log(error);
				});									
			}).catch((error)=>{
				notify('Something went wrong','error');
				//console.log(error);
			});
		}
		else{
			document.getElementById('todayDate').innerHTML = '<span class="animated fadeIn">'+'Date : '+day+'/'+month+'/'+year+'</span>';
			document.getElementById('currentCourse').innerHTML = '<span class="animated fadeIn">'+'Course : '+courseid+'</span>';
			document.getElementById('currentSession').innerHTML = '<span class="animated fadeIn">'+'Session : '+newSessionNo+'</span>';
			db.collection('attendance').doc('2018').collection(courseid).doc(tdate)
			.set({
				session : {
					1:{
						takenBy : facultyIndex, //WARNING : should be currently logged in faculty
						timeStamp: new Date()
					}
				}
			}).then(()=>{
				db.collection('courses').doc(courseid).get()
				.then((doc)=>{
					var enrolledStuds = doc.data().enrolled;
					for(x in enrolledStuds){
						db.collection('attendance').doc('2018').collection(courseid).doc(tdate).collection('session1').doc(enrolledStuds[x])
						.set({
							present:'1'
						}).then(function(){
						}).catch((error)=>{
							notify('Something went wrong','error');
							//console.log(error);
						});
					}
				}).then(function(){
					getAttendanceTableForNewSession(1);
				}).catch((error)=>{
					notify('Something went wrong','error');
					//console.log('error',error);
				});
			})
			.catch((error)=>{
				notify('Something went wrong','error');
				//console.log(error);
			});
		}
	});
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
		document.getElementById(studid).innerHTML =  '<span class="animated fadeIn">'+"Attended "+presentDays+" of "+totalSessions+" sessions<br>Percentage <i>"+percent+"%</i>"+'</span>';
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

function displayPercentage(course){
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