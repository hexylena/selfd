function addElementToRow(row, element){
	var cell = document.createElement("td");
	if(typeof element === "string" || typeof element === "number"){
		cell.innerHTML = element;
	} else {
		cell.appendChild(element);
	}
	row.appendChild(cell);
}

function makeRow(elements){
	var row = document.createElement("tr");
	elements.forEach(element => {
		addElementToRow(row, element);
	});
	return row;
}

function sum(arr){
	return arr.reduce((partialSum, a) => partialSum + a, 0);
}

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('service-worker.js');
}

function persistData(prefs, data){
	data.last_update = moment();
	if(prefs.url && prefs.key){
		console.log("persistData", prefs.url, data);
		// curl -D - -X POST -F file=@package.json http://localhost:8000/cgi-bin/store.py?key=$KEY\&action\=write
		var url = `${prefs.url}?action=write&key=${prefs.key}`;
		var formData = new FormData();
		formData.append("file", new Blob([JSON.stringify(data)], {type: "application/json"}));
		fetch(url, {method: "POST", body: formData}).then(r => r.text()).then(console.log);
	} else {
		localStorage.setItem("data", JSON.stringify(data));
	}
}

function retrieveData(server, key){
	if(server && key){
		console.log(`Fetching data ${server}`)
		var url = `${server}?action=read&key=${key}`;
		return fetch(url).then(response => response.json());
	}
}

