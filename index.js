function loadData(){
	var d = JSON.parse(localStorage.getItem("data"));
	if (d == null) {
		d = {
			counters: {
				"counter1": ["2023-01-01T12:00:00.000Z", "2023-01-02T21:00:00.000Z", "2023-01-03T18:00:00.000Z"],
				"tram/4/old": ["2023-01-03T00:00:00.000Z"],
				"tram/4/new": [],
			},
			gauges: {
			}
		};
	}
	// Convert all datapoints to momentjs
	for (var key in d.counters) {
		var counter = d.counters[key];
		for (var i = 0; i < counter.length; i++) {
			counter[i] = moment(counter[i]);
		}
	}
	return d;
}

// Load the data from local storage
let data = loadData();

// Hook up dialog buttons
document.querySelectorAll("button[data-dialog]").forEach(button => {
	button.addEventListener("click", (evt) => {
		let dialog_id = evt.target.dataset.dialog
		document.getElementById(dialog_id).showModal();

	});
})

document.querySelectorAll("dialog button[data-action='cancel']").forEach(button => {
	button.addEventListener("click", (evt) => {
		let dialog_id = evt.target.dataset.dialog
		document.getElementById(dialog_id).showModal();

	});
})

const saveButton = document.getElementById("add");

saveButton.addEventListener("click", () => {
	// Get the data from the form
	var key = document.getElementById("key").value;
	var type = document.getElementById("type").value;
	data[type][key] = [];
	dialog.close();
	saveData();
});

// Save the data to local storage
function saveData() {
	localStorage.setItem("data", JSON.stringify(data));
	updateTables();
}

function incrementCounter(key){
	data.counters[key].push(moment());
	updateTables();
	saveData();
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
		button = document.createElement("button");
		button.dataset.key = key;
		if(counter.length > 0){
			console.log(counter.slice(-1)[0].format('lll'))
			button.innerHTML = counter.slice(-1)[0].fromNow();
		} else {
			button.innerHTML = "Never";
		}
		button.addEventListener("click", (e) => {
			incrementCounter(e.target.dataset.key);
		});

		cell.appendChild(button);
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

document.getElementById("export").addEventListener("click", () => {
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}));
	a.download = 'export.json';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
})
