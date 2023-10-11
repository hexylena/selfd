const dialog = document.querySelector("dialog#add-new");
const showButton = document.querySelector("button#new-button");
const closeButton = document.querySelector("dialog button#cancel");
const saveButton = document.querySelector("dialog button#confirm");

// Load the data from local storage
var data = JSON.parse(localStorage.getItem("data"));
if (data == null) {
	data = {
		counters: {
			"counter1": ["2023-01-01T00:00:00.000Z", "2023-01-02T00:00:00.000Z", "2023-01-03T00:00:00.000Z"],
		},
		gauges: {
		}
	};
}

// "Show the dialog" button opens the dialog modally
showButton.addEventListener("click", () => {
  dialog.showModal();
});

// "Close" button closes the dialog
closeButton.addEventListener("click", () => {
  dialog.close();
});

saveButton.addEventListener("click", () => {
	// Get the data from the form
	var key = document.getElementById("key").value;
	var type = document.getElementById("type").value;
	data[type][key] = [];
	dialog.close();
	saveData();
	updateTables();
});


// Convert all datapoints to momentjs
for (var key in data.counters) {
	var counter = data.counters[key];
	for (var i = 0; i < counter.length; i++) {
		counter[i] = moment(counter[i]);
	}
}


// Save the data to local storage
function saveData() {
	localStorage.setItem("data", JSON.stringify(data));
}

function updateTables(){
	// For each counter, load into the table #counters
	document.querySelector("#counters tbody").innerHTML = "";
	for (var key in data.counters) {
		var counter = data.counters[key];
		var row = document.createElement("tr");

		var cell = document.createElement("td");
		cell.innerHTML = key;
		row.appendChild(cell);

		cell = document.createElement("td");
		cell.innerHTML = counter.length;
		row.appendChild(cell);

		cell = document.createElement("td");
		if(counter.length > 0){
			cell.innerHTML = counter.slice(-1)[0].startOf('day').fromNow();
		} else {
			cell.innerHTML = "Never";
		}
		row.appendChild(cell);

		document.querySelector("#counters tbody").appendChild(row);
	}
}

updateTables();

// When user changes the value, update the validation
document.getElementById("key").addEventListener("input", function(e) {
	// set aria-invalid="true" if the input is invalid, and set an appropriate error message
	e.target.setAttribute('aria-invalid', e.target.value.length == 0);
});
