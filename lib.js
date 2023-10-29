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

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('service-worker.js');
}
