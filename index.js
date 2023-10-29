const APP_DATA_VERSION = 1;
const EXAMPLE_DATA = {
	VERSION: 1,
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
			step: 0.5,
			values: [
				["2023-01-01T12:00:00.000Z", 4],
				["2023-01-02T21:00:00.000Z", 0.5],
			]
		},
		"mh/anxiety": {
			unit: null,
			min: 0,
			max: 7,
			step: 1,
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

function loadData(){
	let d = JSON.parse(localStorage.getItem("data"));

	if (d.VERSION != APP_DATA_VERSION) {
		alert("Data version mismatch. Triggering a download of your data.");
		triggerDownload(JSON.stringify(data), 'application/json', 'export.json');
	}

	if (d === null) {
		d = EXAMPLE_DATA;
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
let data;
data = loadData();

// Hook up dialog open buttons
document.querySelectorAll("button[data-dialog]").forEach(button => {
	button.addEventListener("click", (evt) => {
		let dialog_id = evt.target.dataset.dialog
		document.getElementById(dialog_id).showModal();
	});
})

// Cancel buttons should close the dialog
document.querySelectorAll("dialog button[data-action='cancel']").forEach(button => {
	button.addEventListener("click", (evt) => {
		evt.target.closest("dialog").close();
	});
})

// Confirm buttons will need more login.
document.querySelectorAll("dialog button.confirm").forEach(button => {
	button.addEventListener("click", (evt) => {
		let dialog = evt.target.closest("dialog");
		// Get form fields
		let inputs = dialog.querySelectorAll("input, select");
		let form = Object.fromEntries([...inputs].map(i => {
			if(i.type == "checkbox"){
				return [i.name, i.checked]
			} else {
				return [i.name, i.value || null]
			}
		}))
		form.values = [];

		// get type, the dialog's id without add-type-
		let type = dialog.id.split("-").slice(2)[0] + 's';
		if(type == "counters"){
			if (form.simple) {
				data[type].simple[form.key] = form;
			} else {
				data[type].complex[form.key] = form;
			}
		} else {
			data[type][form.key] = form;
		}
		console.log(data);

		inputs.forEach(i => i.value = "");
		dialog.close();

		saveData(data);
		updateTables();
	});
})

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

		var row = makeRow([
			key,
			`${counter.values.length} ${counter.unit ? counter.unit : ""}`,
		]);
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

	if (Object.keys(data.counters.complex).length > 0) {
		var subheader = document.createElement("tr");
		subheader.setAttribute("class", "subheader");
		subheader.innerHTML = "<td colspan='3'>Complex counters</td>";
		countertable.appendChild(subheader);
	}

	for (var key in data.counters.complex) {
		var counter = data.counters.complex[key];

		var row = makeRow([
			key,
			`${sum(counter.values.map(e => e[1]))} ${counter.unit ? counter.unit : ""}`,
		]);

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
		var gauge = data.gauges[key];

		var row = makeRow([
			key,
			`${gauge.values.length ? gauge.values.slice(-1)[0][1] : ""} ${gauge.unit ? gauge.unit : ""}`,
		]);

		var c = document.createElement("div");
		c.setAttribute("class", "complex-input");
		input = document.createElement("input"); // numeric
		input.setAttribute("type", "number");
		if(gauge.min !== undefined){
			input.setAttribute("min", gauge.min);
		}
		if(gauge.max !== undefined){
			input.setAttribute("max", gauge.max);
		}
		if(gauge.step !== undefined){
			input.setAttribute("step", gauge.step);
		}

		button = document.createElement("button");
		button.disabled = true;
		button.dataset.key = key;
		if(gauge.values.length > 0){
			button.innerHTML = gauge.values.slice(-1)[0][0].fromNow()
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
document.querySelectorAll("input[required]").forEach(i => {
	console.log(i)
	i.addEventListener("input", function(e) {
		// set aria-invalid="true" if the input is invalid, and set an appropriate error message
		e.target.setAttribute('aria-invalid', e.target.value.length == 0);
	});
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
	for (var key in d.counters.simple) {
		var counter = d.counters.simple[key];
		console.log(key, lines, counter);
		for (var i = 0; i < counter.values.length; i++) {
			// true key is everything before first /
			var trueKey = key.split("/")[0];
			// the other segments are added as numbered tags t1/t2/t3
			var tags = key.split("/").slice(1).map((x, i) => "t" + (i+1) + "=" + x);
			tags.push("type=counter");
			if(counter.unit){
				tags.push("unit=" + counter.unit);
			}
			lines.push(trueKey + "," + tags.join(",") + " value=1 " + counter.values[i].unix() + "000000000");
			// Yea looks good:
			// tram,t1=4,t2=old value=1 1672700400000000
			// tram,t1=4,t2=new value=1 1698402571000000
			// tram,t1=4,t2=new value=1 1698403091000000
		}
	}

	for (var key in d.counters.complex) {
		var counter = d.counters.complex[key];
		console.log(key, lines, counter);
		for (var i = 0; i < counter.values.length; i++) {
			// true key is everything before first /
			var trueKey = key.split("/")[0];
			// the other segments are added as numbered tags t1/t2/t3
			var tags = key.split("/").slice(1).map((x, i) => "t" + (i+1) + "=" + x);
			tags.push("type=counter");
			if(counter.unit){
				tags.push("unit=" + counter.unit);
			}
			lines.push(trueKey + "," + tags.join(",") + ` value=${counter.values[i][1]} ` + counter.values[i][0].unix() + "000000000");
		}
	}

	for (var key in d.gauges) {
		var gauge = d.gauges[key];
		console.log(key, lines, gauge);
		for (var i = 0; i < gauge.values.length; i++) {
			// true key is everything before first /
			var trueKey = key.split("/")[0];
			// the other segments are added as numbered tags t1/t2/t3
			var tags = key.split("/").slice(1).map((x, i) => "t" + (i+1) + "=" + x);
			tags.push("type=gauge");
			if(gauge.unit){
				tags.push("unit=" + gauge.unit);
			}
			lines.push(trueKey + "," + tags.join(",") + ` value=${gauge.values[i][1]} ` + gauge.values[i][0].unix() + "000000000");
		}
	}
	return lines
}

document.getElementById("export").addEventListener("click", () => {
	triggerDownload(JSON.stringify(data), 'application/json', 'export.json');
})

document.getElementById("export-influxdb").addEventListener("click", () => {
	triggerDownload(toInflux(data).join("\n"), 'text/plain', 'export.influx.txt');
})

document.getElementById("reset").addEventListener("click", () => {
	if(confirm("Are you sure you want to reset to the example data?")){
		localStorage.clear();
		data = loadData();
		updateTables();
	}
})

document.getElementById("clear-example").addEventListener("click", () => {
	if(confirm("Are you sure you want to clear all data?")){
		data = EXAMPLE_DATA;
		data.counters.simple = {};
		data.counters.complex = {};
		data.gauges = {};
		data.timers = {};

		saveData(data);
		updateTables();
	}
})
