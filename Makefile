serve:
	python -m http.server --cgi

assets/512.png: assets/logo.svg
	convert -density 300 -resize 512x assets/logo.svg assets/512.png
	optipng assets/512.png

assets/192.png: assets/logo.svg
	convert -density 300 -resize 192x assets/logo.svg assets/192.png
	optipng assets/192.png

build: css/style.css index.js lib.js
	mkdir -p dist
	cat css/*.css > dist/style.css
	cat *.js > dist/script.js
