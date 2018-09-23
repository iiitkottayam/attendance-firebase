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