
function setup() {
	
	document.getElementById("catButton").addEventListener("click", addCat, true);
	document.getElementById("purchButton").addEventListener("click", addPurch, true);
	document.getElementById("deleteButton").addEventListener("click", deleteCat, true);
	
	var catRow = document.getElementById("labelRow");
	addCell(catRow, "Uncategorized");
	
	var budgetRow = document.getElementById("budgetRow");
	addCell(budgetRow, "None");
	
	var spentRow = document.getElementById("spentRow");
	addCell(spentRow, 0);
	
	var calcRow = document.getElementById("calcRow");
	addCell(calcRow, "N/A")

	makeReq("GET", "/cats", 200, catDropDown);
	makeReq("Get", "/cats", 200, refreshBuild);
	makeReq("GET", "/purchases", 200, numCrunch)
}
//to add a category I need to send it to flask
//get first row of table  and add a new cell
//update options in the select tag for add purchase dropdown	
function addCat() {
	var newCat = document.getElementById("catName").value;
	var catVal = document.getElementById("catVal").value;
	var data = "catName=" + newCat + "&catVal=" + catVal;
	makeReq("POST", "/cats", 201, function() {
		var catRow = document.getElementById("labelRow");
		addCell(catRow, newCat);
	
		var budgetRow = document.getElementById("budgetRow");
		addCell(budgetRow, catVal);
	
		var spentRow = document.getElementById("spentRow");
		addCell(spentRow, 0);
	
		var calcRow = document.getElementById("calcRow");
		addCell(calcRow, catVal)
	}, data);
	
	
	
	document.getElementById("catForm").reset();
	
	makeReq("GET", "/cats", 200, catDropDown);
	
}



function addPurch() {
	var purchCat = document.getElementById("catDrop").value;
	var purchDate = document.getElementById("purchDate").value;
	var purchase = document.getElementById("thePurchase").value;
	var paidOut = document.getElementById("paidOut").value;
	
	var data = "catName=" + purchCat + "&purchDate=" + purchDate + "&thePurchase=" + purchase + "&paidOut=" + paidOut;
	makeReq("POST", "/purchases", 201, numCrunch, data);
	
	document.getElementById("purchForm").reset();
}

function deleteCat() {
	var deleteCat = document.getElementById("deleteDrop").value
	var data = "catName=" + deleteCat;
	makeReq("DELETE", "/cats", 200, catDropDown, data);
	
	var table = document.getElementById("theTable")
	for (var i = 2; i < table.rows[0].cells.length; i++){
		if (table.rows[0].cells[i].innerText === deleteCat ) {
			table.rows[0].deleteCell(i);
			table.rows[1].deleteCell(i);
			table.rows[2].deleteCell(i);
			table.rows[3].deleteCell(i);
		}
	}
	makeReq("GET", '/purchases', 200, numCrunch);
}


//Method being get, post or delete
//target being the url
//retCode 
//data being the info to be sent
function makeReq(method, target, retCode, action, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);
	
	if (data){
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText);
				action(JSON.parse(httpRequest.responseText));
				
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}

function catDropDown(responseText) {
	var drop = document.getElementById("catDrop");
	var delDrop = document.getElementById("deleteDrop")
	
	while (drop.firstChild) {
		drop.removeChild(drop.firstChild);
		delDrop.removeChild(delDrop.firstChild);
	}
	
	//apparently I can't append the same element to both dropdowns
	for (var i = 0; i < responseText.length; i++) {
		var option = document.createElement('OPTION');
		var delOption = document.createElement('OPTION');
		
		option.text = responseText[i].category;
		option.value = responseText[i].category;
		
		delOption.text = responseText[i].category;
		delOption.value = responseText[i].category;
		
		drop.appendChild(option);
		delDrop.appendChild(delOption);
	}
}

function numCrunch(responseText) {
	console.log(responseText)
	var table = document.getElementById("theTable");
	var cats = ["Uncategorized"];
	responseText = responseText.filter( function(purchase){
		var date = purchase.date.split(/\D/);
		var today = new Date();
		if ((today.getMonth() + 1) === parseInt(date[1]) && today.getFullYear() === parseInt(date[0])) {
			return true
		}
		return false;
	});
	for (var i = 1; i < table.rows[0].cells.length; i++) {
		cats.push(table.rows[0].cells[i].innerText);
		cur = responseText.filter( function(purchase) {
			if (purchase.category === table.rows[0].cells[i].innerText) {
				return true;
			}
			return false;
		});
		sum = {amtPaid: 0}
		if (cur.length > 0) {
			sum = cur.reduce(function(purch1, purch2){
			
				return {amtPaid: parseFloat(purch1.amtPaid) + parseFloat(purch2.amtPaid)}
		}); }
		table.rows[2].cells[i].innerText = sum.amtPaid;
		limit = parseFloat(table.rows[1].cells[i].innerText);
		if (!isNaN(limit)) {
			var diff = limit - sum.amtPaid;
			table.rows[3].cells[i].innerText = diff;
			
			if (diff < 0) {
				table.rows[3].cells[i].className = "red"
			}
		}
	
	}
	
	var uncategorized = responseText.filter( function(purchase) {
		return !cats.includes(purchase.category);
	});
	sum = {amtPaid:0}
	if (uncategorized.length > 0) {
		sum = uncategorized.reduce(function(purch1, purch2){
			return {amtPaid: parseFloat(purch1.amtPaid) + parseFloat(purch2.amtPaid)}
	});}
	table.rows[2].cells[1].innerText = parseFloat(table.rows[2].cells[1].innerText) + sum.amtPaid;
}
//Not the most dry, this code is repeated 3 times, maybe fix later
function refreshBuild(responseText) {
	var table = document.getElementById("theTable");
	for (var i = 1; i < responseText.length; i++){
		var catRow = document.getElementById("labelRow");
		addCell(catRow, responseText[i].category);
		
		var budgetRow = document.getElementById("budgetRow");
		addCell(budgetRow, responseText[i].limit);
		
		var spentRow = document.getElementById("spentRow");
		addCell(spentRow, 0);
		
		var calcRow = document.getElementById("calcRow");
		addCell(calcRow, responseText[i].limit);
	}
}

function addCell(row, text) {
	var newCell = row.insertCell();
	if (row.id === "calcRow") {
		newCell.className = "green";
	}
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

// setup load event
window.addEventListener("load", setup, true);