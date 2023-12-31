let data, prefs;
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
	},
	last_update: "2023-01-01T12:00:00.000Z"
}

function loadData(){
	if(prefs.url && prefs.key){
		console.log(`Loading data ${prefs.url}`);
		retrieveData(prefs.url, prefs.key).then(d => {
			server_data = momentifyData(d);
			local_data = momentifyData(loadDataLocal());
			// If the server data is newer, check that the user wants to use that.
			// if (!local_data.last_update || server_data.last_update.isAfter(local_data.last_update)) {
			// 	if(confirm("Server data is newer than local data. Do you want to use the server data?")){
			// 		data = server_data;
			// 	} else {
			// 		data = local_data;
			// 	}
			if(server_data.last_update.isAfter(local_data.last_update)) {
				data = server_data;
			} else {
				// Otherwise the server's data is older, so, push to the server
				data = local_data;
				persistData(prefs, data);
			}
			updateTables(false);
		})
	} else {
		console.log(`Loading data from local storage`);
		data = momentifyData(loadDataLocal());
		updateTables(false);
	}
}

function momentifyData(d){
	// Convert all datapoints to momentjs
	d.last_update = moment(d.last_update);
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

function loadDataLocal(){
	let d = JSON.parse(localStorage.getItem("data"));

	if (d !== null && d.VERSION !== null && d.VERSION !== undefined && d.VERSION != APP_DATA_VERSION) {
		if(confirm("Data version mismatch. Triggering a download of your data. Accept to download a copy of your data.")){
			triggerDownload(JSON.stringify(data), 'application/json', 'export.json');
		}
	}

	if (d === null) {
		d = EXAMPLE_DATA;
	}

	return d;
}

// Save the data to local storage
function saveData() {
	persistData(prefs, data)
	updateTables();
}

function incrementCounterSimple(key){
	data.counters.simple[key].values.push(moment());
	saveData();
}

function incrementCounterComplex(key, val){
	data.counters.complex[key].values.push([
		moment(),
		parseInt(val)
	]);
	saveData();
}

function setGauge(key, val){
	data.gauges[key].values.push([
		moment(),
		parseInt(val)
	]);
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
	saveData();
}

function updateTables(update){
	if(MODE === 'compact'){
		updateTablesCompact(update);
	} else {
		updateTablesDefault(update);
	}
	updateGraphs();
}

function updateGraphs(){
	
}

function updateTablesDefault(update){
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
		input.setAttribute("placeholder", "0");
		input.setAttribute("aria-label", "Enter a value to increment the counter");
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
		input.setAttribute("placeholder", "0");
		input.setAttribute("aria-label", "Enter a value to increment the counter");
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


function updateTablesCompact(update){
	function Li(e){
		var li = document.createElement("li");
		li.appendChild(e);
		return li;
	}

	// For each counter, load into the table #counters
	const all = document.querySelector("#all")
	all.innerHTML = "";

	function renderCounter(key){
		var counter = data.counters.simple[key];
		button = document.createElement("button");
		button.dataset.key = key;
		if(counter.values.length > 0){
			button.innerHTML = `${key} (${counter.values.slice(-1)[0].fromNow()})`;
		} else {
			button.innerHTML = `${key}`;
		}
		button.addEventListener("click", (e) => {
			incrementCounterSimple(e.target.dataset.key);
		});

		all.appendChild(Li(button));
	}

	function renderCounterComplex(key){
		var counter = data.counters.complex[key];

		var c = document.createElement("div");
		c.setAttribute("class", "complex-input");
		input = document.createElement("input"); // numeric
		input.setAttribute("type", "number");
		input.setAttribute("placeholder", "0");
		input.setAttribute("aria-label", "Enter a value to increment the counter");
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
			button.innerHTML = `${key} (${counter.values.length ? counter.values.slice(-1)[0][1] : ""} ${counter.unit ? counter.unit : ""} @ ${counter.values.slice(-1)[0][0].fromNow()})`
		} else {
			button.innerHTML = `${key}`;
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

		all.appendChild(Li(c));
	}

	function renderGauge(key){
		var gauge = data.gauges[key];

		var c = document.createElement("div");
		c.setAttribute("class", "complex-input");
		input = document.createElement("input"); // numeric
		input.setAttribute("type", "number");
		input.setAttribute("placeholder", "0");
		input.setAttribute("aria-label", "Enter a value to increment the counter");
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
			button.innerHTML = `${key} (${gauge.values.length ? gauge.values.slice(-1)[0][1] : ""} ${gauge.unit ? gauge.unit : ""} @ ${gauge.values.slice(-1)[0][0].fromNow()})`;
		} else {
			button.innerHTML = key;
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

		all.appendChild(Li(c));

	}

	function renderTimer(key){
		var timer = data.timers[key];

		var button = document.createElement("button");
		button.dataset.key = key;
		if(timer.values.length > 0 && !timer.values.slice(-1)[0].end.isValid()){
			button.innerHTML = `${key}: stop (Running since ${timer.values.slice(-1)[0].start.fromNow()})`;
		} else {
			button.innerHTML = `${key}: start`;
		}
		input.addEventListener("input", (e) => {
			// enable the button
			e.target.nextSibling.disabled = false;
		});
		button.addEventListener("click", (e) => {
			toggleTimer(e.target.dataset.key);
		});

		all.appendChild(Li(button));
	}

	var sortedkeys = [
		...Object.keys(data.counters.simple).map(k => [k, 'simple']),
		...Object.keys(data.counters.complex).map(k => [k, 'complex']),
		...Object.keys(data.gauges).map(k => [k, 'gauges']),
		...Object.keys(data.timers).map(k => [k, 'timers']),
	]
	// Sort the keys object by their first element of each pair
	function compareFn(a, b){
		if(a[0] < b[0]){ return -1 }
		else if (a[0] > b[0]) {return 1}
		else { return 0 }
	}
	sortedkeys.sort(compareFn);

	sortedkeys.forEach(k => {
		key = k[0]
		type = k[1]
		if(type == 'simple'){
			renderCounter(key)
		}
		else if(type == 'complex'){
			renderCounterComplex(key)
		}
		else if(type == 'gauges') {
			renderGauge(key)
		}
		else {
			renderTimer(key)
		}
	})
}

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


function hookUpButtons(){
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
	document.querySelectorAll("dialog.new button.confirm").forEach(button => {
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

			inputs.forEach(i => i.value = "");
			dialog.close();

			saveData();
		});
	})

	document.querySelectorAll("dialog#preferences button.confirm").forEach(button => {
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

			prefs = form;
			localStorage.setItem("preferences", JSON.stringify(form));
			dialog.close();
		});
	})

	// When user changes the value, update the validation
	document.querySelectorAll("input[required]").forEach(i => {
		i.setAttribute('aria-invalid', true);
		i.addEventListener("input", function(e) {
			// set aria-invalid="true" if the input is invalid, and set an appropriate error message
			e.target.setAttribute('aria-invalid', e.target.value.length == 0);
		});
	});


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
			// Clone example data
			data = JSON.parse(JSON.stringify(EXAMPLE_DATA));
			data.counters.simple = {};
			data.counters.complex = {};
			data.gauges = {};
			data.timers = {};

			saveData();
		}
	})

	// Load user preferences from local storage
	document.querySelectorAll("input[data-store]").forEach(input => {
		// That data-store attribute is the JS variable in which the
		// data is persisted, so, load it from there.
		console.log(`Loading ${input.dataset.store} (${eval(input.dataset.store)}) from localStorage and setting ${input}`);
		if(input.type == "checkbox"){
			input.checked = eval(input.dataset.store);
		} else {
			input.value = eval(input.dataset.store);
		}
	})
}

function loadPreferences(){
	let prefs = localStorage.getItem("preferences");
	if(prefs){
		p = JSON.parse(prefs);
		if(p.compact){
			document.body.classList.add("compact");
		}
		return p;
	} else {
		return {};
	}
}

// Load the data from local storage
prefs = loadPreferences();
hookUpButtons();
loadData();

// Every 5 minutes check for fresh data
setInterval(loadData, 5 * 60 * 1000);
