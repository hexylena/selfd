function loadData(){
	var d = JSON.parse(localStorage.getItem("data"));
	if (d == null) {
		d = {
			counters: {
				simple: {
					"counter1": {
						unit: null,
						values: ["2023-01-01T12:00:00.000Z", "2023-01-02T21:00:00.000Z", "2023-01-03T18:00:00.000Z"],
					},
					"tram/4/old": {
						unit: null,
						values: ["2023-01-03T00:00:00.000Z"],
					},
					"tram/4/new": {
						unit: null,
						values: []
					},
				},
				complex: {
					"drinkjes/40%abv": {
						unit: 'mL',
						min: 0,
						values: [
							["2023-02-01T12:00:00.000Z", 100],
							["2023-02-02T21:00:00.000Z", 90],
						]
					},
					"drinkjes/14%abv": {
						unit: 'mL',
						min: 0,
						values: [
							["2023-01-01T12:00:00.000Z", 100],
							["2023-01-02T21:00:00.000Z", 90],
						]
					}
				}
			},
			gauges: {
				"pain/head": {
					unit: null,
					min: 0,
					max: 5,
					increments: 0.5,
					values: [
						["2023-01-01T12:00:00.000Z", 4],
						["2023-01-02T21:00:00.000Z", 0.5],
					]
				},
				"mh/anxiety": {
					unit: null,
					min: 0,
					max: 7,
					increments: 1,
					values: [
						["2023-07-01T12:00:00.000Z", 4],
						["2023-07-02T21:00:00.000Z", 3],
					]
				}
			},
			timers: {
				"period": {
					values: [
						{start: "2023-01-01T12:00:00.000Z", end: "2023-01-05T12:00:00.000Z"},
						{start: "2023-08-01T12:00:00.000Z", end: null},
					]
				},
				"other": {
					values: [
						{start: "2023-01-01T12:00:00.000Z", end: "2023-01-05T12:00:00.000Z"},
					]
				}
			}
		}
	}

	// Convert all datapoints to momentjs
	for (var key in d.counters.simple) {
		d.counters.simple[key].values.forEach((v, i) => {
			d.counters.simple[key].values[i] = moment(v);
		});
	}
	for (var key in d.counters.complex) {
		d.counters.complex[key].values.forEach((v, i) => {
			d.counters.complex[key].values[i] = [moment(v[0]), v[1]];
		});
	}
	for (var key in d.gauges) {
		d.gauges[key].values.forEach((v, i) => {
			d.gauges[key].values[i] = [moment(v[0]), v[1]];
		});
	}
	for (var key in d.timers) {
		d.timers[key].values.forEach((v, i) => {
			d.timers[key].values[i].start = moment(v.start);
			d.timers[key].values[i].end = moment(v.end);
		});
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

function incrementCounterSimple(key){
	data.counters.simple[key].values.push(moment());
	updateTables();
	saveData();
}

function incrementCounterComplex(key, val){
	data.counters.complex[key].values.push([
		moment(),
		parseInt(val)
	]);
	updateTables();
	saveData();
}

function setGauge(key, val){
	data.gauges[key].values.push([
		moment(),
		parseInt(val)
	]);
	updateTables();
	saveData();
}

function toggleTimer(key){
	var timer = data.timers[key];
	if(timer.values.length == 0 || timer.values.slice(-1)[0].end.isValid()){
		timer.values.push({
			start: moment(),
			end: moment(null), // intentional
		});
	} else {
		timer.values.slice(-1)[0].end = moment();
	}
	updateTables();
	saveData();
}


function updateTables(){
	// For each counter, load into the table #counters
	const countertable = document.querySelector("#counters tbody")
	countertable.innerHTML = "";
	for (var key in data.counters.simple) {
		var counter = data.counters.simple[key];

		var row = makeRow([key, counter.values.length]);
		button = document.createElement("button");
		button.dataset.key = key;
		if(counter.values.length > 0){
			button.innerHTML = counter.values.slice(-1)[0].fromNow();
		} else {
			button.innerHTML = "Never";
		}
		button.addEventListener("click", (e) => {
			incrementCounterSimple(e.target.dataset.key);
		});

		addElementToRow(row, button);

		countertable.appendChild(row);
	}

	var subheader = document.createElement("tr");
	subheader.setAttribute("class", "subheader");
	subheader.innerHTML = "<td colspan='3'>Complex counters</td>";
	countertable.appendChild(subheader);

	for (var key in data.counters.complex) {
		var counter = data.counters.complex[key];

		var row = makeRow([key, counter.values.slice(-1)[0][1]]);

		var c = document.createElement("div");
		c.setAttribute("class", "complex-input");
		input = document.createElement("input"); // numeric
		input.setAttribute("type", "number");
		if(counter.min !== undefined){
			input.setAttribute("min", counter.min);
		}
		if(counter.max !== undefined){
			input.setAttribute("max", counter.max);
		}

		button = document.createElement("button");
		button.disabled = true;
		button.dataset.key = key;
		if(counter.values.length > 0){
			button.innerHTML = counter.values.slice(-1)[0][0].fromNow()
		} else {
			button.innerHTML = "Never";
		}
		input.addEventListener("input", (e) => {
			// enable the button
			e.target.nextSibling.disabled = false;
		});
		button.addEventListener("click", (e) => {
			incrementCounterComplex(e.target.dataset.key, e.target.previousSibling.value);
		});
		c.appendChild(input);
		c.appendChild(button);

		addElementToRow(row, c);

		countertable.appendChild(row);
	}

	// Gauges
	const gaugestable = document.querySelector("#gauges tbody")
	gaugestable.innerHTML = "";
	for (var key in data.gauges) {
		var gauges = data.gauges[key];

		var row = makeRow([key, gauges.values.slice(-1)[0][1]]);

		var c = document.createElement("div");
		c.setAttribute("class", "complex-input");
		input = document.createElement("input"); // numeric
		input.setAttribute("type", "number");
		if(gauges.min !== undefined){
			input.setAttribute("min", gauges.min);
		}
		if(gauges.max !== undefined){
			input.setAttribute("max", gauges.max);
		}

		button = document.createElement("button");
		button.disabled = true;
		button.dataset.key = key;
		if(gauges.values.length > 0){
			button.innerHTML = gauges.values.slice(-1)[0][0].fromNow()
		} else {
			button.innerHTML = "Never";
		}
		input.addEventListener("input", (e) => {
			// enable the button
			e.target.nextSibling.disabled = false;
		});
		button.addEventListener("click", (e) => {
			setGauge(e.target.dataset.key, e.target.previousSibling.value);
		});
		c.appendChild(input);
		c.appendChild(button);

		addElementToRow(row, c);

		gaugestable.appendChild(row);
	}

	// timers
	const timerstable = document.querySelector("#timers tbody")
	timerstable.innerHTML = "";
	for (var key in data.timers) {
		var timer = data.timers[key];
		var row = makeRow([key, timer.values.length]);

		var button = document.createElement("button");
		button.dataset.key = key;
		console.log(timer);
		if(timer.values.length > 0 && !timer.values.slice(-1)[0].end.isValid()){
			button.innerHTML = `End (Running since ${timer.values.slice(-1)[0].start.fromNow()})`;
		} else {
			button.innerHTML = "Start";
		}
		input.addEventListener("input", (e) => {
			// enable the button
			e.target.nextSibling.disabled = false;
		});
		button.addEventListener("click", (e) => {
			toggleTimer(e.target.dataset.key);
		});
		addElementToRow(row, button);

		timerstable.appendChild(row);
	}


}

updateTables();

// When user changes the value, update the validation
document.getElementById("key").addEventListener("input", function(e) {
	// set aria-invalid="true" if the input is invalid, and set an appropriate error message
	e.target.setAttribute('aria-invalid', e.target.value.length == 0);
});

function triggerDownload(contents, type, filename){
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([contents], {type: type}));
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function toInflux(d){
	// myMeasurement,tag1=value1,tag2=value2 fieldKey="fieldValue" 1556813561098000000
	var lines = [];
	for (var key in d.counters) {
		var counter = d.counters[key];
		for (var i = 0; i < counter.length; i++) {
			// true key is everything before first /
			var trueKey = key.split("/")[0];
			// the other segments are added as numbered tags t1/t2/t3
			var tags = key.split("/").slice(1).map((x, i) => "t" + (i+1) + "=" + x).join(",");
			lines.push(trueKey + "," + tags + " value=1 " + counter[i].unix() + "000000000");
			// Yea looks good:
			// tram,t1=4,t2=old value=1 1672700400000000
			// tram,t1=4,t2=new value=1 1698402571000000
			// tram,t1=4,t2=new value=1 1698403091000000
		}
	}
	return lines.join("\n");
}

document.getElementById("export").addEventListener("click", () => {
	triggerDownload(JSON.stringify(data), 'application/json', 'export.json');
})

document.getElementById("export-influxdb").addEventListener("click", () => {
	triggerDownload(toInflux(data), 'text/plain', 'export.influx.txt');
})
