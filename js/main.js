$(function(){


	/*
	========================================================================== APPLICATION GLOBALS===================================================	
	*/
	
	var win = $(window),
		body = $(document.body),
		header = $("#header"),
		container = $('#container'),	// the only element in index.html
		name,
		projectid,
		taskid,
		currentUser = {};
		
	/* 	
	==========================================================================	SETUP FOR INIT ========================================================
	*/
	
	//checks the login and then decides whether to load the landing page or the application itself
	var checkLogin = function() {
		$.ajax({
			url: "xhr/check_login.php",
			type: "get",
			dataType: "json",
			success: function(response) {
				if(response.user) {
					currentUser = response.user;
					name=currentUser.user_n;
					loadApp();
				} else {
					loadLanding();
				}
			}
		});
	};
	
	//called every time the page is refreshed
	var init = function(){
		checkLogin();
	};	
	init();
	
	
	/* 	
	==========================================================================	Register Functions ========================================================
	*/

	var registerBtn = $("#r_submit");
	
	//when register button is clicked it checks if the required fields are long enough 
	//and then it runs the register php which sends the required fields and if its
	//successful then it will load the app and if not it alerts that there is an error
	registerBtn.live("click", function(e){
		e.preventDefault();
		var r_username = $("#r_user_name").val();
		var r_password = $("#r_password").val();
		var r_email = $("#r_email").val();
		
		if(r_username.length > 2 && r_password.length > 2 && r_email.length > 2) {
			$.ajax({
				url: "../xhr/register.php",
				data: {
					username: r_username,
					password: r_password,
					email: r_email
				},
				type: "post",
				dataType: "json",
				success: function(response) {
					if(response.error) {
						console.log(response);
					} else {
						loadApp();
					}
				}
			});
		} else {
			alert("Too short");
		}
		return false;
	});
	
	
	
	/* 	
	==========================================================================	Login/Logout Functions ========================================================
	*/
	
	
	//variables for login and logout btn
	var loginBtn = $("#login_btn");
	var logoutBtn = $("#logoutBtn");

	//calls the login ajax to use the username and password and login to an account 
	//and then either grants access and loads the app or denies them and alerts 
	//("error on login")
	loginBtn.live("click", function(){
		var user = $("#username").val();
		var pass = $("#password").val();

		$.ajax({
			url: "../xhr/login.php",
			data: {
				username: user,
				password: pass
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
					alert("Error on login");
				} else {
					loadApp();
					currentUser = response.user;
					name=currentUser.user_n;
				}
			}
		});
		return false;
	});
	
	//Logout clicks and executes the logout php and loads the landing page
	logoutBtn.live("click",  function() {
		$.get("xhr/logout.php", function() {
			loadLanding();	
		});
		return false;
	});


	
	/*======================================================================== APPLICATION FUNCTIONS===================================	*/
	
	
	//loads the landing page with two templates (Header and Container)
	var loadLanding = function(){
		$.get("templates/templates.html", function(html) {
			var h = $(html);
			var headerCode = h.find("#template_landing_header").html();
			header.html(headerCode);
		});
		$.get('templates/templates.html', function(html) {
			var i = $(html);
			var landingCode = i.find('#template_landing').html();
			container.html(landingCode);
		});
	};
	
	//loads the app with two templates (Header and Container) renders the template inorder to find
	//the username and then calls the ajax for get projects that retrieves the projects and then it loads 
	//and renders all the projects into their own template and displays in the container
	var loadApp = function(){
		$.get("templates/templates.html", function(html) {
			var h = $(html);
			var headerCode = h.find("#template_header").html();
			$.template('app_header', headerCode);								// compile template
			var newCode = $.render(header, 'app_header');					// use template
			header.html(headerCode).find("h1").html(name);
		});
		$.ajax({
			url: "../xhr/get_projects.php",
			type: "get",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
				} else {
					$.get("templates/templates.html", function(html) {
						var j = $(html);
						var projectCode = j.find("#template_project_link").html();
						$.template('project', projectCode);										// compile template
						var newCode = $.render(response.projects, 'project');			// use template
						container.html(newCode).sortable();
						var projects = $(".project");
						projects.each(function(index){
							$(this).attr("data-id", response.projects[index].id);
							var path = response.projects[index].status;
							$(this).find(".priority img").attr("src" , "images/"+path+".png");
						});
					});
				}
			}
		});
	};
	
	//loads the tasks using the clicked project id and then dynamically gets the header and container
	//for the tasks that will be loaded and renders them all out in the html
	var loadTasks = function(projectid) {
		$.ajax({
			url: "../xhr/get_tasks.php",
			data: {
				projectID: projectid
			},
			type: "get",
			dataType: "json",
			success: function(response) {
				if(response.error) {
					console.log(response);
				} else {
					console.log(response);
					if (response.tasks.length > 0) {
					$.get("templates/templates.html", function(html) {
						var z = $(html);
						var headerCode = z.find("#template_task_header").html();
						$.template('app_task_header', headerCode);								// compile template
						var newCode = $.render(response, 'app_task_header');				// use template
						header.html(newCode);
						header.find("h1").html(response.tasks[0].projectName);
					});
					$.get("templates/templates.html", function(html) {
						var y = $(html);
						var appCode = y.find("#template_task_link").html();
						$.template('task', appCode);												// compile template
						var newCode = $.render(response.tasks, 'task');					// use template
						container.html(newCode).sortable();
						var tasks = $(".task");
						//sets the image paths dynamically according to the status of each task
						tasks.each(function(index){
							var that = $(this);
							that.attr("data-id", response.tasks[index].id);
							var path = response.tasks[index].status;
							that.find(".priority img").attr("src" , "images/"+path+".png");
						});
					});
					} else {
						$.get("templates/templates.html", function(html) {
							var z = $(html);
							var headerCode = z.find("#template_task_header").html();
							$.template('app_task_header', headerCode);								// compile template
							var newCode = $.render(response, 'app_task_header');				// use template
							header.html(newCode);
							//there are no tasks so it instructs you to add one
							header.find("h1").html("Please Add Tasks");
						});
						//loads blank container since there are no tasks to be displayed
						container.html("");
					}
				}
			}
		});
	};
	
	/*
	===================================================================== Project Manipulation =========================================================================
	*/
	
	//date picker functionality
	$("#datePick").datepicker();
	$("#ep_datePick").datepicker();
	$("#t_datePick").datepicker();
	$("#et_datePick").datepicker();
	
	//Edit Projects
	//when clicked it grabs the project id of the clicked project and sends in a request 
	//for that project and its information, it also displays the project info in the placeholder 
	//of the inputs
	var project_edit = $(".edit");
	project_edit.live("click", function(e) {
		e.preventDefault();
		projectid = $(this).parent().parent().attr("data-id");
		$.ajax({
			url: "../xhr/get_projects.php",
			data: {
				projectID: projectid
			},
			type: "get",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
				} else {
					$("#ep_name").attr("placeholder", response.projects[0].projectName);
					$("#ep_description").attr("placeholder", response.projects[0].projectDescription);
					$("#ep_datePick").attr("placeholder", response.projects[0].dueDate);
				}
			}
		});
	});
	
	//Delete Projects
	//grabs the data id of the clicked project and then calls the delete project
	//and refreshes the page once submitted.
	var project_del = $(".delete");
	project_del.live("click", function(e) {
		var projectid = $(this).parent().parent().attr("data-id");
		$.ajax({
			url: "../xhr/delete_project.php",
			data: {
				projectID: projectid
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
					alert("Error on login");
				} else {
					e.preventDefault();
					loadApp();
				}
			}
		});
	});
	
	//Delete Tasks
	//calls the delete task and deletes the current task and then refreshes the page 
	//using the current project id
	var task_del = $(".deleteTask");
	task_del.live("click", function(e) {
		e.preventDefault();
		taskid = $(this).parent().parent().attr("data-id");
		$.ajax({
			url: "../xhr/delete_task.php",
			data: {
				taskID: taskid
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
				} else {
					e.preventDefault();
					loadTasks(projectid);
				}
			}
		});
	});
	
	
	//Add project variables
	var p_priority;
	var p_name;
	var p_desc;
	var p_dDate;
	
	
	//add priority buttons
	//basic animation for the buttons which, when clicked, animate to white and then 
	//set the priority used for the addproject php
	var buttons1 = $("#project a");
	buttons1.each(function(){
		var that = $(this);
		that.on("click", function(e) {
			buttons1.each(function(){
				$(this).animate({color: "black"},300,"easeOutQuad");
			});
			that.animate({color: "white"}, 300, "easeOutQuad");
			e.preventDefault();
			p_priority = that.html();
		});
	});

	//Adding the project by clicking the submit button
	//adds the project using the fields filled out in the popup and then refreshes the 
	//project page
	$("#newProject").on("click", function(e) {
		e.preventDefault();
		p_name = $("#p_name").val();
		p_desc = $("#p_description").val();
		p_dDate = $("#datePick").val();
		
		$.ajax({
			url: "../xhr/new_project.php",
			data: {
				projectName: p_name,
				status: p_priority,
				projectDescription: p_desc,
				dueDate: p_dDate
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
				} else {
					$("#newProjectModal").trigger('reveal:close');
					loadApp();
				}
			}
		});
	});
	
	
	//Edit project variables
	var ep_priority;
	var ep_name;
	var ep_desc;
	var ep_dDate;
	
	//priority buttons for the edit project (same functionality as above)
	var buttons = $("#e_project a");
	buttons.each(function(){
		var that = $(this);
		that.on("click", function(e) {
			buttons.each(function(){
				$(this).animate({color: "black"},300,"easeOutQuad");
			});
			that.animate({color: "white"}, 300, "easeOutQuad");
			e.preventDefault();
			ep_priority = that.html();
		});
	});

	//Adding the updated project by clicking the submit button using the 
	//filled out fields in the pop up form as variables for the php file
	$("#editedProject").on("click", function(e) {
		e.preventDefault();
		ep_name = $("#ep_name").val();
		ep_desc = $("#ep_description").val();
		ep_dDate = $("#ep_datePick").val();
		
		$.ajax({
			url: "../xhr/update_project.php",
			data: {
				projectID: projectid,
				projectDescription: ep_desc,
				projectName: ep_name,
				status: ep_priority,
				dueDate: ep_dDate
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				if(response.error) {
					console.log(response);
				} else {
					$("#editProjectModal").trigger('reveal:close');
					loadApp();
				}
			}
		});
	});
	
	
	//Load tasks for the project which grabs the project id when clicked and then
	//uses the load tasks function with that id
	var projectClicks = $(".project");
	projectClicks.live("click", function(e) {
		e.preventDefault();
		projectid = $(this).attr("data-id");
		loadTasks(projectid); 
	});
	
	//Add task variables
	var t_priority;
	var t_name;
	var t_desc;
	var t_dDate;
	
	//add task priority buttons (same functionality as above
	var buttons2 = $("#n_task a");
	buttons2.each(function(){
		var that = $(this);
		that.on("click", function(e) {
			buttons2.each(function(){
				$(this).animate({color: "black"},300,"easeOutQuad");
			});
			that.animate({color: "white"}, 300, "easeOutQuad");
			e.preventDefault();
			t_priority = that.html();
		});
	});

	
	//Adding the task by clicking the submit button using the pop ups filled out inputs
	//as the php variables
	$("#newTask").on("click", function(e) {
		e.preventDefault();
		t_name = $("#t_name").val();
		t_desc = $("#t_description").val();
		t_dDate = $("#t_datePick").val();
		$.ajax({
			url: "../xhr/new_task.php",
			data: {
				projectID: projectid,
				taskName: t_name,
				status: t_priority,
				taskDescription: t_desc,
				dueDate: t_dDate
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				console.log(response);
				if(response.error) {
					console.log(response);
				} else {
					$("#newTaskModal").trigger('reveal:close');
					
					//VVVVVVVV Below was just strictly for testing VVVVVVVV
					
					//resets all the fields
					$("#t_name").val("");
					$("#t_description").val("");
					$("#t_datePick").val("");
					//resets the button label colors
					buttons2.each(function(){
						$(this).animate({color: "black"},300,"easeOutQuad");
					});
					//then loads the corresponding tasks
					loadTasks(projectid);
				}
			}
		});
	});
	
	//Edit task variables
	var et_priority;
	var et_name;
	var et_desc;
	var et_dDate;
	
	//priority buttons (same functionality as above)
	var buttons3 = $("#e_task a");
	buttons3.each(function(){
		var that = $(this);
		that.on("click", function(e) {
			buttons3.each(function(){
				$(this).animate({color: "black"},300,"easeOutQuad");
			});
			that.animate({color: "white"}, 300, "easeOutQuad");
			e.preventDefault();
			et_priority = that.html();
		});
	});
	
	//sets the project id when the mouse enters the task html (workaround)
	var edits = $(".task");
	edits.live("mouseenter", function(){
		taskid = $(this).attr("data-id");
	});

	//Adding the updated task by clicking the submit button using the popups input 
	//fields for php variables 
	$("#editedTask").on("click", function(e) {
		e.preventDefault();
		et_name = $("#et_name").val();
		et_desc = $("#et_description").val();
		et_dDate = $("#et_datePick").val();
		console.log(taskid);
		$.ajax({
			url: "../xhr/update_task.php",
			data: {
				taskID: taskid,
				taskDescription: et_desc,
				taskName: et_name,
				status: et_priority,
				dueDate: et_dDate
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				if(response.error) {
					console.log(response);
				} else {
					$("#editTaskModal").trigger('reveal:close');
					loadTasks(projectid);
				}
			}
		});
	});
		
	//Back functionality for Task Page
	var backBtn = $("#back");
	backBtn.live("click", function(e){
		e.preventDefault();
		loadApp();
	});
	
	
	//Edit account variables
	var a_username;
	var a_password;
	var a_email;
	

	//Updating the user using the popup input fields for variables 
	//and then it loads the app
	$("#editAccountSubmit").on("click", function(e) {
		e.preventDefault();
		a_username = $("#newUsername").val();
		a_password = $("#newPassword").val();
		a_email = $("#newEmail").val();
		$.ajax({
			url: "../xhr/update_user.php",
			data: {
				password: a_password,
				email: a_email,
				first_name: a_username
			},
			type: "post",
			dataType: "json",
			success: function(response) {
				if(response.error) {
					console.log(response);
				} else {
					$("#editAccountModal").trigger('reveal:close');
					loadApp();
				}
			}
		});
	});


});










